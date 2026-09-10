// PlayerAnimation.js
// STEP 1: player procedural animation extracted from core/main.js.
//
// This module owns:
// - procedural skeleton state
// - WALK animation
// - A/D turn overlays
// - soft directional turning
// - finger / arm procedural animation
// - procedural idle
//
// Dependencies are injected once from main.js so the existing behavior remains unchanged.

export function createPlayerAnimationSystem(deps){
  const {
    THREE,
    getPose,
    getRest,
    getBones,
    solveCharacterFloorContact,
    normalizeAngle,
    lerpAngle,
    getPlayer,
    QUEST,
    GLOBAL_DIALOGUE_LOCK,
    PLAYER_HAND_TUNING,
    PLAYER_TURN_TUNING,
    AD_CURRENT,
    PLAYER_PROCEDURAL_WALK_CONFIG,
    PLAYER_PROCEDURAL_TURN_CONFIG,
    AD_TURN_WALK
  } = deps;

  let AD_CURRENT_FRAME_ACTIVE=false;

  function setADCurrentFrameActive(value){
    AD_CURRENT_FRAME_ACTIVE=!!value;
  }

  function resetPlayerProceduralState(character){
    PLAYER_PROCEDURAL_STATE.delete(character);
    PLAYER_SOFT_TURN_STATE.delete(character);
  }

const PLAYER_AXIS_RIGHT=new THREE.Vector3(1,0,0);
const PLAYER_AXIS_UP=new THREE.Vector3(0,1,0);
const PLAYER_AXIS_FORWARD=new THREE.Vector3(0,0,1);
const PLAYER_PROCEDURAL_STATE=new WeakMap();

function getPlayerFingerBones(c,bones){
  const fingers=[];
  const seen=new Set();

  const detectFinger=(name)=>{
    const n=String(name||"").toLowerCase();
    if(n.includes("thumb")) return "thumb";
    if(n.includes("index")) return "index";
    if(n.includes("middle")) return "middle";
    if(n.includes("ring")) return "ring";
    if(n.includes("pinky") || n.includes("little")) return "pinky";
    return null;
  };

  const detectSide=(bone)=>{
    const chain=[];
    let node=bone;
    for(let i=0;node && i<6;i++,node=node.parent){
      chain.push(String(node.name||"").toLowerCase());
    }
    const all=chain.join(" ");

    if(
      /(^|[^a-z])(left|l)([^a-z]|$)/.test(all) ||
      all.includes("lefthand") ||
      all.includes("hand_l") ||
      all.includes("hand.l") ||
      all.includes("_l_") ||
      all.includes(".l.")
    ) return "left";

    if(
      /(^|[^a-z])(right|r)([^a-z]|$)/.test(all) ||
      all.includes("righthand") ||
      all.includes("hand_r") ||
      all.includes("hand.r") ||
      all.includes("_r_") ||
      all.includes(".r.")
    ) return "right";

    return null;
  };

  const addBone=(bone,forcedSide=null)=>{
    if(!bone?.isBone || seen.has(bone)) return;

    const finger=detectFinger(bone.name);
    if(!finger) return;

    const side=forcedSide || detectSide(bone);
    if(!side) return;

    seen.add(bone);
    fingers.push({
      bone,
      side,
      finger,
      name:String(bone.name||"").toLowerCase()
    });
  };


  c?.model?.traverse?.((bone)=>addBone(bone));


  bones.leftHand?.traverse?.((bone)=>addBone(bone,"left"));
  bones.rightHand?.traverse?.((bone)=>addBone(bone,"right"));

  return fingers;
}

function applyPlayerFingerCurl(c,state,phase,amount=1){
  const fingers=state.fingers||[];
  if(!fingers.length) return;


  for(const f of fingers){
    if(!f?.bone || !state.restQ.has(f.bone)) continue;

    const isThumb=f.finger==="thumb";
    const segment=f.segment||2;

    const sidePhase=
      f.side==="left"
        ? phase*1.35
        : phase*1.35+Math.PI*.65;

    const pulse=(Math.sin(sidePhase)+1)*.5;

    const base=isThumb ? .012 : .020;
    const movingCurl=isThumb ? .018 : .032;

    const segmentGain=
      segment<=1 ? .48 :
      segment===2 ? .70 :
      segment===3 ? .82 :
      .16;

    const curl=
      (base+pulse*movingCurl)*
      segmentGain*
      amount;

    setPlayerBoneAxisRotation(
      c,
      state,
      f.bone,
      PLAYER_AXIS_RIGHT,
      curl
    );
  }
}

function createPlayerProceduralState(c){
  const b=getBones(c);
  const restQ=new Map();
  const restP=new Map();
  Object.values(b).filter(Boolean).forEach((bone)=>{
    restQ.set(bone,bone.quaternion.clone());
    restP.set(bone,bone.position.clone());
  });
  const fingers=getPlayerFingerBones(c,b);
  fingers.forEach(({bone})=>{
    if(!restQ.has(bone)) restQ.set(bone,bone.quaternion.clone());
    if(!restP.has(bone)) restP.set(bone,bone.position.clone());
  });
  const state={
    bones:b,
    fingers,
    restQ,
    restP,
    phase:0,
    lastTime:performance.now(),
    initialized:true,
    modelBaseY:c.model ? c.model.position.y : 0
  };
  PLAYER_PROCEDURAL_STATE.set(c,state);
  return state;
}
function getPlayerProceduralState(c){
  let state=PLAYER_PROCEDURAL_STATE.get(c);
  if(!state || !state.initialized || state.bones.hips?.parent===null){
    state=createPlayerProceduralState(c);
  }
  return state;
}
function smooth01(v){
  const x=THREE.MathUtils.clamp(v,0,1);
  return x*x*(3-2*x);
}
function getPlayerGaitPhase(phase){
  const s=Math.sin(phase);
  const c=Math.cos(phase);
  const pushOff=smooth01((-c-0.08)/0.92);
  const swingLift=smooth01((-s+0.02)/1.02);
  const landing=smooth01((c-0.08)/0.92);
  const support=smooth01((s+0.15)/1.15)*smooth01((c+0.35)/1.35);
  const knee=
    pushOff*0.34+
    swingLift*0.90-
    landing*0.08;
  const ankle=
    -s*0.20+
    pushOff*0.38-
    landing*0.22-
    support*0.05;
  const toe=
    pushOff*0.50-
    landing*0.06;
  return {
    hip:s,
    knee:Math.max(0.02,knee),
    ankle,
    toe
  };
}
function restorePlayerProceduralPose(state){
  for(const [bone,q] of state.restQ){
    bone.quaternion.copy(q);
  }
  for(const [bone,p] of state.restP){
    bone.position.copy(p);
  }
}
function getPlayerAxisInBoneParent(c,bone,axisInModel){
  if(!c.model || !bone || !bone.parent) return null;
  c.model.updateMatrixWorld(true);
  bone.parent.updateMatrixWorld(true);
  const modelWorldQ=new THREE.Quaternion();
  const parentWorldQ=new THREE.Quaternion();
  c.model.getWorldQuaternion(modelWorldQ);
  bone.parent.getWorldQuaternion(parentWorldQ);
  return axisInModel.clone()
    .applyQuaternion(modelWorldQ)
    .normalize()
    .applyQuaternion(parentWorldQ.invert())
    .normalize();
}
function setPlayerBoneAxisRotation(c,state,bone,axisInModel,angle){
  if(!bone || !state.restQ.has(bone)) return;
  const axisParent=getPlayerAxisInBoneParent(c,bone,axisInModel);
  if(!axisParent) return;
  const deltaQ=new THREE.Quaternion().setFromAxisAngle(axisParent,angle);
  bone.quaternion.copy(state.restQ.get(bone));
  bone.quaternion.premultiply(deltaQ);
}
function addPlayerBoneAxisRotation(c,bone,axisInModel,angle){
  if(!bone) return;
  const axisParent=getPlayerAxisInBoneParent(c,bone,axisInModel);
  if(!axisParent) return;
  const deltaQ=new THREE.Quaternion().setFromAxisAngle(axisParent,angle);
  bone.quaternion.premultiply(deltaQ);
}
function applyPlayerOldArms(c,state,phase,isWalking){
  const cfg=PLAYER_PROCEDURAL_WALK_CONFIG.oldArms;
  const b=state.bones;
  const pose=getPose(c);
  const walk=Math.sin(phase);
  const walkOpp=Math.sin(phase+Math.PI);
  if(isWalking){
    if(b.leftShoulder){
      b.leftShoulder.rotation.set(
        getRest(c,b.leftShoulder).x,
        getRest(c,b.leftShoulder).y,
        getRest(c,b.leftShoulder).z+walkOpp*cfg.shoulderZ
      );
    }
    if(b.rightShoulder){
      b.rightShoulder.rotation.set(
        getRest(c,b.rightShoulder).x,
        getRest(c,b.rightShoulder).y,
        getRest(c,b.rightShoulder).z+walk*cfg.shoulderZ
      );
    }
    const leftArmZAmount=(walkOpp+1)*0.5;
    const rightArmZAmount=(walk+1)*0.5;
    const leftArmZ=THREE.MathUtils.lerp(
      cfg.leftArmZMin,
      cfg.leftArmZMax,
      leftArmZAmount
    );
    const rightArmZ=THREE.MathUtils.lerp(
      cfg.rightArmZMin,
      cfg.rightArmZMax,
      rightArmZAmount
    );
    if(b.leftArm){
      b.leftArm.rotation.set(
        pose.armX+cfg.armBaseX+walkOpp*cfg.armSwingX,
        0,
        leftArmZ
      );
    }
    if(b.rightArm){
      b.rightArm.rotation.set(
        pose.armX+cfg.armBaseX+walk*cfg.armSwingX,
        0,
        rightArmZ
      );
    }
    const leftElbowZAmount=(walkOpp+1)*0.5;
    const rightElbowZAmount=(walk+1)*0.5;
    const leftForeArmZ=THREE.MathUtils.lerp(
      cfg.leftForeArmZMin,
      cfg.leftForeArmZMax,
      leftElbowZAmount
    );
    const rightForeArmZ=THREE.MathUtils.lerp(
      cfg.rightForeArmZMin,
      cfg.rightForeArmZMax,
      rightElbowZAmount
    );
    if(b.leftForeArm){
      b.leftForeArm.rotation.set(
        pose.foreArmX+cfg.foreArmBaseX+Math.max(0,walk)*cfg.foreArmMoveX,
        0,
        leftForeArmZ
      );
    }
    if(b.rightForeArm){
      b.rightForeArm.rotation.set(
        pose.foreArmX+cfg.foreArmBaseX+Math.max(0,walkOpp)*cfg.foreArmMoveX,
        0,
        rightForeArmZ
      );
    }
    if(b.leftHand){
      b.leftHand.rotation.set(
        getRest(c,b.leftHand).x,
        getRest(c,b.leftHand).y,
        getRest(c,b.leftHand).z+walkOpp*cfg.handZ
      );
    }
    if(b.rightHand){
      b.rightHand.rotation.set(
        getRest(c,b.rightHand).x,
        getRest(c,b.rightHand).y,
        getRest(c,b.rightHand).z+walk*cfg.handZ
      );
    }
  }else{
    if(b.leftShoulder){
      b.leftShoulder.rotation.copy(getRest(c,b.leftShoulder));
    }
    if(b.rightShoulder){
      b.rightShoulder.rotation.copy(getRest(c,b.rightShoulder));
    }
    if(b.leftArm){
      b.leftArm.rotation.set(pose.armX,0,0);
    }
    if(b.rightArm){
      b.rightArm.rotation.set(pose.armX,0,0);
    }
    if(b.leftForeArm){
      b.leftForeArm.rotation.set(
        pose.foreArmX,
        0,
        cfg.leftForeArmZBase
      );
    }
    if(b.rightForeArm){
      b.rightForeArm.rotation.set(
        pose.foreArmX,
        0,
        cfg.rightForeArmZBase
      );
    }
    if(b.leftHand){
      b.leftHand.rotation.copy(getRest(c,b.leftHand));
    }
    if(b.rightHand){
      b.rightHand.rotation.copy(getRest(c,b.rightHand));
    }
  }
}
function applyPlayerOldArmsTurn(c,state,phase){
  const cfg=PLAYER_PROCEDURAL_TURN_CONFIG.oldArms;
  const b=state.bones;
  const pose=getPose(c);

  // Dedicated A/D turn arm cycle.
  // Same idea as oldArms, but with smaller swing values.
  const turn=Math.sin(phase*.82);
  const turnOpp=Math.sin(phase*.82+Math.PI);

  const SHOULDER_SWING_SCALE=AD_TURN_WALK.shoulderSwing;
  const ARM_SWING_SCALE=AD_TURN_WALK.armSwing;
  const FOREARM_SWING_SCALE=AD_TURN_WALK.forearmSwing;
  const HAND_SWING_SCALE=AD_TURN_WALK.handSwing;

  if(b.leftShoulder){
    b.leftShoulder.rotation.set(
      getRest(c,b.leftShoulder).x,
      getRest(c,b.leftShoulder).y,
      getRest(c,b.leftShoulder).z+
        turnOpp*cfg.shoulderZ*SHOULDER_SWING_SCALE
    );
  }

  if(b.rightShoulder){
    b.rightShoulder.rotation.set(
      getRest(c,b.rightShoulder).x,
      getRest(c,b.rightShoulder).y,
      getRest(c,b.rightShoulder).z+
        turn*cfg.shoulderZ*SHOULDER_SWING_SCALE
    );
  }

  const leftArmZAmount=(turnOpp+1)*.5;
  const rightArmZAmount=(turn+1)*.5;

  const leftArmZ=THREE.MathUtils.lerp(
    cfg.leftArmZMin,
    cfg.leftArmZMax,
    leftArmZAmount
  );

  const rightArmZ=THREE.MathUtils.lerp(
    cfg.rightArmZMin,
    cfg.rightArmZMax,
    rightArmZAmount
  );

  if(b.leftArm){
    b.leftArm.rotation.set(
      pose.armX+
        cfg.armBaseX+
        turnOpp*cfg.armSwingX*ARM_SWING_SCALE,
      0,
      THREE.MathUtils.lerp(
        pose.armZ||0,
        leftArmZ,
        ARM_SWING_SCALE
      )
    );
  }

  if(b.rightArm){
    b.rightArm.rotation.set(
      pose.armX+
        cfg.armBaseX+
        turn*cfg.armSwingX*ARM_SWING_SCALE,
      0,
      THREE.MathUtils.lerp(
        pose.armZ||0,
        rightArmZ,
        ARM_SWING_SCALE
      )
    );
  }

  const leftElbowZAmount=(turnOpp+1)*.5;
  const rightElbowZAmount=(turn+1)*.5;

  const leftForeArmZ=THREE.MathUtils.lerp(
    cfg.leftForeArmZMin,
    cfg.leftForeArmZMax,
    leftElbowZAmount
  );

  const rightForeArmZ=THREE.MathUtils.lerp(
    cfg.rightForeArmZMin,
    cfg.rightForeArmZMax,
    rightElbowZAmount
  );

  if(b.leftForeArm){
    b.leftForeArm.rotation.set(
      pose.foreArmX+
        cfg.foreArmBaseX+
        Math.max(0,turn)*cfg.foreArmMoveX*FOREARM_SWING_SCALE,
      0,
      THREE.MathUtils.lerp(
        cfg.leftForeArmZBase,
        leftForeArmZ,
        FOREARM_SWING_SCALE
      )
    );
  }

  if(b.rightForeArm){
    b.rightForeArm.rotation.set(
      pose.foreArmX+
        cfg.foreArmBaseX+
        Math.max(0,turnOpp)*cfg.foreArmMoveX*FOREARM_SWING_SCALE,
      0,
      THREE.MathUtils.lerp(
        cfg.rightForeArmZBase,
        rightForeArmZ,
        FOREARM_SWING_SCALE
      )
    );
  }

  if(b.leftHand){
    b.leftHand.rotation.set(
      getRest(c,b.leftHand).x,
      getRest(c,b.leftHand).y,
      getRest(c,b.leftHand).z+
        turnOpp*cfg.handZ*HAND_SWING_SCALE
    );
  }

  if(b.rightHand){
    b.rightHand.rotation.set(
      getRest(c,b.rightHand).x,
      getRest(c,b.rightHand).y,
      getRest(c,b.rightHand).z+
        turn*cfg.handZ*HAND_SWING_SCALE
    );
  }
}

function capturePlayerPose(state){
  const snapshot=new Map();
  for(const bone of state.restQ.keys()){
    snapshot.set(bone,{
      quaternion:bone.quaternion.clone(),
      position:bone.position.clone()
    });
  }
  return snapshot;
}
function blendPlayerPoseFromSnapshot(state,snapshot,amount,positionAmount=amount){
  const targetQ=new THREE.Quaternion();
  const targetP=new THREE.Vector3();
  for(const bone of state.restQ.keys()){
    const previous=snapshot.get(bone);
    if(!previous) continue;
    targetQ.copy(bone.quaternion);
    bone.quaternion.copy(previous.quaternion).slerp(targetQ,amount);
    targetP.copy(bone.position);
    bone.position.copy(previous.position).lerp(targetP,positionAmount);
  }
}
function solvePlayerFloorCollision(c,state){
  return solveCharacterFloorContact({
    THREE,
    character:c,
    player:getPlayer(),
    state,
    floorClearance:PLAYER_PROCEDURAL_WALK_CONFIG.floorClearance
  });
}

function applyPlayerRealFingerCurl(c,state,lateralTurnOnly,comboTurn=false){
  const fingers=state?.fingers||[];
  if(!fingers.length) return;

  const phase=state.phase||0;
  const walkPulse=(Math.sin(phase*1.15)+1)*.5;


  const baseCurl=(lateralTurnOnly || comboTurn)
    ? 0
    : PLAYER_HAND_TUNING.walkFingerCurl;

  const leftScale=PLAYER_HAND_TUNING.walkFingerCurlLeft ?? 1;
  const rightScale=PLAYER_HAND_TUNING.walkFingerCurlRight ?? 1;

  for(const f of fingers){
    if(!f?.bone || !state.restQ.has(f.bone)) continue;

    const n=String(f.name||f.bone.name||"").toLowerCase();
    const isThumb=n.includes("thumb");
    const m=n.match(/(?:thumb|index|middle|ring|pinky|little)[^0-9]*([1-4])/);
    const segment=m ? Number(m[1]) : 2;


    const segmentGain=
      segment===1 ? .70 :
      segment===2 ? .95 :
      segment===3 ? 1.08 :
      1.14;

    const sideScale=f.side==="left" ? leftScale : rightScale;
    const sideSign=f.side==="left" ? 1 : -1;


    const closeRadians=(isThumb ? .32 : .46) * baseCurl * segmentGain * sideScale;
    const gaitVariation=lateralTurnOnly ? 1 : (.88 + walkPulse*.12);

    setPlayerBoneAxisRotation(
      c,state,f.bone,PLAYER_AXIS_RIGHT,
      closeRadians*gaitVariation*sideSign
    );


    if(isThumb){
      addPlayerBoneAxisRotation(
        c,f.bone,PLAYER_AXIS_UP,
        .10*baseCurl*sideScale*(f.side==="left" ? 1 : -1)
      );
    }
  }
}



// AD_TURN_WALK is injected by main.js

function animatePlayerWalk(c,direction=1,strafe=0){
if(!c.ready || !c.model) return;
  const isADTurn=AD_CURRENT_FRAME_ACTIVE===true;
  const cfg=isADTurn
    ? PLAYER_PROCEDURAL_TURN_CONFIG
    : PLAYER_PROCEDURAL_WALK_CONFIG;
  const state=getPlayerProceduralState(c);
  const b=state.bones;
  const now=performance.now();
  const delta=Math.min((now-state.lastTime)/1000,0.05);
  state.lastTime=now;
  const gaitDirection=direction<0 ? -1 : 1;
  const gaitSpeed=direction<0 ? .68 : 1.0;
const lateralTurnOnly=
    Math.abs(strafe)>.001 &&
    gaitDirection>0;

  const soloTurnMotionScale=
    lateralTurnOnly ? .028 : 1.0;

  const soloTurnLegScale=
    lateralTurnOnly
      ? AD_TURN_WALK.legScale
      : 1.0;
  state.phase+=
    delta*
    cfg.cycleRadiansPerSecond*
    Math.max(cfg.speed,0.04)*
    gaitDirection*
    gaitSpeed*
    (lateralTurnOnly ? AD_TURN_WALK.cycleScale : 1)*
    (AD_CURRENT_FRAME_ACTIVE?AD_CURRENT.walkCycleScale:1);
  const previousPose=capturePlayerPose(state);
  restorePlayerProceduralPose(state);
  const left=getPlayerGaitPhase(state.phase);
  const right=getPlayerGaitPhase(state.phase+Math.PI);
  const legSign=cfg.invertHips ? -1 : 1;
  const kneeSign=cfg.invertKnees ? -1 : 1;
  left.hip*=legSign;
  right.hip*=legSign;
  setPlayerBoneAxisRotation(c,state,b.leftUpLeg,PLAYER_AXIS_RIGHT,left.hip*cfg.stride*soloTurnLegScale);
  setPlayerBoneAxisRotation(c,state,b.rightUpLeg,PLAYER_AXIS_RIGHT,right.hip*cfg.stride*soloTurnLegScale);
  setPlayerBoneAxisRotation(
    c,state,b.leftKnee,PLAYER_AXIS_RIGHT,
    kneeSign*left.knee*cfg.knee*soloTurnLegScale
  );
  setPlayerBoneAxisRotation(
    c,state,b.rightKnee,PLAYER_AXIS_RIGHT,
    kneeSign*right.knee*cfg.knee*soloTurnLegScale
  );


  const turnFootScale=
    lateralTurnOnly
      ? AD_TURN_WALK.footScale
      : 1.0;

  const turnToeScale=
    lateralTurnOnly ? 0.0 : 1.0;

  setPlayerBoneAxisRotation(
    c,state,b.leftFoot,PLAYER_AXIS_RIGHT,
    left.ankle*cfg.ankle*turnFootScale
  );


  setPlayerBoneAxisRotation(
    c,state,b.rightFoot,PLAYER_AXIS_RIGHT,
    lateralTurnOnly ? 0 : right.ankle*cfg.ankle
  );
  setPlayerBoneAxisRotation(
    c,state,b.leftToe,PLAYER_AXIS_RIGHT,
    left.toe*cfg.toeFactor*turnToeScale
  );
  setPlayerBoneAxisRotation(
    c,state,b.rightToe,PLAYER_AXIS_RIGHT,
    right.toe*cfg.toeFactor*turnToeScale
  );

  if(lateralTurnOnly){


    const turnDir=Math.sign(strafe)||0;


    const leftPivotWeight=
      turnDir<0 ? .05 : 1.0;

    const rightPivotWeight=
      turnDir>0 ? .05 : 1.0;


    const stepWave=
      Math.max(0,Math.sin(state.phase*.82));

    const outsideLift=
      THREE.MathUtils.degToRad(AD_TURN_WALK.outsideLiftDeg)*
      stepWave;

    const outsideKnee=
      THREE.MathUtils.degToRad(AD_TURN_WALK.outsideKneeDeg)*
      stepWave;

    const outsideFootFlex=
      THREE.MathUtils.degToRad(AD_TURN_WALK.outsideFootDeg)*
      stepWave;


    if(turnDir<0){
      addPlayerBoneAxisRotation(
        c,b.rightUpLeg,
        PLAYER_AXIS_RIGHT,
        -outsideLift
      );
      addPlayerBoneAxisRotation(
        c,b.rightKnee,
        PLAYER_AXIS_RIGHT,
        outsideKnee
      );
      addPlayerBoneAxisRotation(
        c,b.rightFoot,
        PLAYER_AXIS_RIGHT,
        outsideFootFlex*.35
      );
    }


    if(turnDir>0){
      addPlayerBoneAxisRotation(
        c,b.leftUpLeg,
        PLAYER_AXIS_RIGHT,
        -outsideLift
      );
      addPlayerBoneAxisRotation(
        c,b.leftKnee,
        PLAYER_AXIS_RIGHT,
        outsideKnee
      );
      addPlayerBoneAxisRotation(
        c,b.leftFoot,
        PLAYER_AXIS_RIGHT,
        outsideFootFlex*.80
      );
    }

    const footYaw=
      THREE.MathUtils.degToRad(AD_TURN_WALK.footYawDeg)*
      -turnDir;

    addPlayerBoneAxisRotation(
      c,b.leftFoot,
      PLAYER_AXIS_UP,
      footYaw*leftPivotWeight*
        (turnDir>0 ? 1.62 : 1.0)
    );

    addPlayerBoneAxisRotation(
      c,b.rightFoot,
      PLAYER_AXIS_UP,
      footYaw*rightPivotWeight*
        (turnDir<0 ? 1.62 : 1.0)
    );


    const footPhase=
      Math.sin(state.phase*.92);

    const ankleRoll=
      THREE.MathUtils.degToRad(AD_TURN_WALK.ankleRollDeg)*
      footPhase;

    const ankleFlex=
      THREE.MathUtils.degToRad(AD_TURN_WALK.ankleFlexDeg)*
      Math.sin(state.phase*.92+Math.PI*.5);


    addPlayerBoneAxisRotation(
      c,b.leftFoot,
      PLAYER_AXIS_FORWARD,
      ankleRoll*turnDir*leftPivotWeight
    );

    addPlayerBoneAxisRotation(
      c,b.rightFoot,
      PLAYER_AXIS_FORWARD,
      -ankleRoll*turnDir*rightPivotWeight
    );

    addPlayerBoneAxisRotation(
      c,b.leftFoot,
      PLAYER_AXIS_RIGHT,
      ankleFlex
    );


    addPlayerBoneAxisRotation(
      c,b.rightFoot,
      PLAYER_AXIS_RIGHT,
      -ankleFlex*.38
    );


    const legTurnYaw=
      THREE.MathUtils.degToRad(AD_TURN_WALK.legYawDeg)*
      -turnDir;

    const kneeTurnYaw=
      THREE.MathUtils.degToRad(AD_TURN_WALK.kneeYawDeg)*
      -turnDir;

    addPlayerBoneAxisRotation(
      c,b.leftUpLeg,
      PLAYER_AXIS_UP,
      legTurnYaw
    );

    addPlayerBoneAxisRotation(
      c,b.rightUpLeg,
      PLAYER_AXIS_UP,
      legTurnYaw
    );

    addPlayerBoneAxisRotation(
      c,b.leftKnee,
      PLAYER_AXIS_UP,
      kneeTurnYaw
    );

    addPlayerBoneAxisRotation(
      c,b.rightKnee,
      PLAYER_AXIS_UP,
      kneeTurnYaw
    );

    const toeYaw=
      THREE.MathUtils.degToRad(PLAYER_HAND_TUNING.turnWristYawDeg)*
      -turnDir;

    addPlayerBoneAxisRotation(
      c,b.leftToe,
      PLAYER_AXIS_UP,
      toeYaw
    );

    addPlayerBoneAxisRotation(
      c,b.rightToe,
      PLAYER_AXIS_UP,
      toeYaw
    );
  }


  if(lateralTurnOnly){
    const armBones=[
      b.leftShoulder,b.rightShoulder,
      b.leftArm,b.rightArm,
      b.leftForeArm,b.rightForeArm,
      b.leftHand,b.rightHand
    ];
    const beforeArmQ=new Map();

    for(const bone of armBones){
      if(bone) beforeArmQ.set(bone,bone.quaternion.clone());
    }

    applyPlayerOldArmsTurn(c,state,state.phase);

    for(const bone of armBones){
      const before=beforeArmQ.get(bone);
      if(before){
        bone.quaternion.slerpQuaternions(
          before,
          bone.quaternion,
          AD_TURN_WALK.armBlend
        );
      }
    }
  }else{
    applyPlayerOldArms(c,state,state.phase,true);
  }


  const armWave=(Math.sin(state.phase))*soloTurnMotionScale;
  const armOpp=-armWave;
  const backwardFactor=gaitDirection<0 ? .82 : 1.0;
  const shoulderCounter=PLAYER_HAND_TUNING.walkShoulderCounter*backwardFactor;
  const foreTwist=PLAYER_HAND_TUNING.walkForeTwist*backwardFactor;
  const wristSwing=PLAYER_HAND_TUNING.walkWristSwing*backwardFactor;
  const wristRoll=PLAYER_HAND_TUNING.walkWristRollRaw*backwardFactor;

  addPlayerBoneAxisRotation(c,b.leftShoulder,PLAYER_AXIS_UP,armOpp*shoulderCounter);
  addPlayerBoneAxisRotation(c,b.rightShoulder,PLAYER_AXIS_UP,armWave*shoulderCounter);

  addPlayerBoneAxisRotation(c,b.leftForeArm,PLAYER_AXIS_UP,armWave*foreTwist);
  addPlayerBoneAxisRotation(c,b.rightForeArm,PLAYER_AXIS_UP,armOpp*foreTwist);

  addPlayerBoneAxisRotation(c,b.leftHand,PLAYER_AXIS_RIGHT,armWave*wristSwing);
  addPlayerBoneAxisRotation(c,b.rightHand,PLAYER_AXIS_RIGHT,armOpp*wristSwing);
  addPlayerBoneAxisRotation(c,b.leftHand,PLAYER_AXIS_FORWARD,armOpp*wristRoll);
  addPlayerBoneAxisRotation(c,b.rightHand,PLAYER_AXIS_FORWARD,armWave*wristRoll);


  const handFlexWave=Math.sin(state.phase*1.45);
  const handTwistWave=Math.sin(state.phase*1.45+Math.PI*.5);


  const turnHandWave=
    lateralTurnOnly
      ? Math.sin(state.phase*1.10)
      : 0;

  const turnHandTwist=
    lateralTurnOnly
      ? Math.sin(state.phase*1.10+Math.PI*.5)
      : 0;

  addPlayerBoneAxisRotation(
    c,b.leftHand,
    PLAYER_AXIS_RIGHT,
    (lateralTurnOnly ? turnHandWave*PLAYER_HAND_TUNING.turnHandFollowFlex : handFlexWave*PLAYER_HAND_TUNING.walkExtraFlex)*soloTurnMotionScale
  );
  addPlayerBoneAxisRotation(
    c,b.rightHand,
    PLAYER_AXIS_RIGHT,
    -(lateralTurnOnly ? turnHandWave*PLAYER_HAND_TUNING.turnHandFollowFlex : handFlexWave*PLAYER_HAND_TUNING.walkExtraFlex)*soloTurnMotionScale
  );

  addPlayerBoneAxisRotation(
    c,b.leftHand,
    PLAYER_AXIS_UP,
    (lateralTurnOnly ? turnHandTwist*PLAYER_HAND_TUNING.turnHandFollowTwist : handTwistWave*PLAYER_HAND_TUNING.walkExtraTwist)*soloTurnMotionScale
  );
  addPlayerBoneAxisRotation(
    c,b.rightHand,
    PLAYER_AXIS_UP,
    -(lateralTurnOnly ? turnHandTwist*PLAYER_HAND_TUNING.turnHandFollowTwist : handTwistWave*PLAYER_HAND_TUNING.walkExtraTwist)*soloTurnMotionScale
  );

  applyPlayerFingerCurl(
    c,
    state,
    state.phase,
    lateralTurnOnly ? PLAYER_HAND_TUNING.turnFingerCurl : PLAYER_HAND_TUNING.walkFingerCurl
  );

  const turnBodyScale=
    lateralTurnOnly
      ? .10
      : 1.0;
  const pelvisTwist=Math.sin(state.phase)*cfg.pelvisTwist*turnBodyScale;
  const pelvisRoll=Math.sin(state.phase*2)*cfg.pelvisRoll*turnBodyScale;
  const bodyBreath=Math.sin(state.phase*2)*cfg.breathingSway*turnBodyScale;


  const travelLean=
    gaitDirection<0
      ? -0.012
      : (lateralTurnOnly
          ? 0.0015
          : 0.010);
  setPlayerBoneAxisRotation(c,state,b.hips,PLAYER_AXIS_UP,pelvisTwist);
  addPlayerBoneAxisRotation(c,b.hips,PLAYER_AXIS_FORWARD,pelvisRoll);
  setPlayerBoneAxisRotation(c,state,b.spine,PLAYER_AXIS_UP,-pelvisTwist*0.30);
  addPlayerBoneAxisRotation(c,b.spine,PLAYER_AXIS_RIGHT,bodyBreath+travelLean);
  addPlayerBoneAxisRotation(c,b.spine1,PLAYER_AXIS_RIGHT,travelLean*.55);
  setPlayerBoneAxisRotation(c,state,b.spine1,PLAYER_AXIS_UP,-pelvisTwist*0.20);
  addPlayerBoneAxisRotation(c,b.spine1,PLAYER_AXIS_RIGHT,bodyBreath*0.55);
  setPlayerBoneAxisRotation(c,state,b.spine2,PLAYER_AXIS_UP,-pelvisTwist*0.12);
  addPlayerBoneAxisRotation(c,b.spine2,PLAYER_AXIS_RIGHT,bodyBreath*0.25);
  setPlayerBoneAxisRotation(c,state,b.neck,PLAYER_AXIS_UP,pelvisTwist*0.08);
  setPlayerBoneAxisRotation(c,state,b.head,PLAYER_AXIS_UP,pelvisTwist*0.035);
  if(b.hips && state.restP.has(b.hips)){
    b.hips.position.copy(state.restP.get(b.hips));
    const turnBodyPosScale=
      1;
    b.hips.position.x+=Math.sin(state.phase)*0.018*turnBodyPosScale;
    b.hips.position.y+=Math.cos(state.phase*2)*0.018*turnBodyPosScale;
    b.hips.position.z+=
      Math.sin(state.phase)*
      (lateralTurnOnly ? 0.0025 : 0.010)*
      turnBodyPosScale;
  }
  blendPlayerPoseFromSnapshot(
    state,
    previousPose,
    cfg.walkPoseLerp,
    cfg.walkPoseLerp
  );


  if(!lateralTurnOnly){
    const walkHandWave=
      Math.sin(state.phase);

    const walkHandWaveOpp=
      Math.sin(state.phase+Math.PI);

    const walkHandTwist=
      Math.sin(state.phase+Math.PI*.5);

    const walkHandFlex=
      THREE.MathUtils.degToRad(PLAYER_HAND_TUNING.walkWristFlexDeg);

    const walkHandYaw=
      THREE.MathUtils.degToRad(PLAYER_HAND_TUNING.walkWristYawDeg);

    const walkHandRoll=
      THREE.MathUtils.degToRad(PLAYER_HAND_TUNING.walkWristRollDeg);

    addPlayerBoneAxisRotation(
      c,b.leftHand,
      PLAYER_AXIS_RIGHT,
      walkHandWave*walkHandFlex
    );

    addPlayerBoneAxisRotation(
      c,b.rightHand,
      PLAYER_AXIS_RIGHT,
      walkHandWaveOpp*walkHandFlex
    );

    addPlayerBoneAxisRotation(
      c,b.leftHand,
      PLAYER_AXIS_UP,
      walkHandTwist*walkHandYaw
    );

    addPlayerBoneAxisRotation(
      c,b.rightHand,
      PLAYER_AXIS_UP,
      -walkHandTwist*walkHandYaw
    );

    addPlayerBoneAxisRotation(
      c,b.leftHand,
      PLAYER_AXIS_FORWARD,
      -walkHandWave*.85*walkHandRoll
    );

    addPlayerBoneAxisRotation(
      c,b.rightHand,
      PLAYER_AXIS_FORWARD,
      walkHandWaveOpp*.85*walkHandRoll
    );
  }


  if(lateralTurnOnly){
    const handFlex=
      THREE.MathUtils.degToRad(PLAYER_HAND_TUNING.turnWristFlexDeg)*
      turnHandWave;

    const handYaw=
      THREE.MathUtils.degToRad(PLAYER_HAND_TUNING.turnWristYawDeg)*
      turnHandTwist;

    const handRoll=
      THREE.MathUtils.degToRad(PLAYER_HAND_TUNING.turnWristRollDeg)*
      turnHandWave;

    const foreYaw=
      THREE.MathUtils.degToRad(PLAYER_HAND_TUNING.turnForeYawDeg)*
      turnHandWave;

    const armFollow=
      THREE.MathUtils.degToRad(PLAYER_HAND_TUNING.turnArmFollowDeg)*
      turnHandWave;


    addPlayerBoneAxisRotation(
      c,b.leftHand,
      PLAYER_AXIS_RIGHT,
      handFlex
    );
    addPlayerBoneAxisRotation(
      c,b.rightHand,
      PLAYER_AXIS_RIGHT,
      -handFlex
    );

    addPlayerBoneAxisRotation(
      c,b.leftHand,
      PLAYER_AXIS_UP,
      handYaw
    );
    addPlayerBoneAxisRotation(
      c,b.rightHand,
      PLAYER_AXIS_UP,
      -handYaw
    );

    addPlayerBoneAxisRotation(
      c,b.leftHand,
      PLAYER_AXIS_FORWARD,
      -handRoll
    );
    addPlayerBoneAxisRotation(
      c,b.rightHand,
      PLAYER_AXIS_FORWARD,
      handRoll
    );

    addPlayerBoneAxisRotation(
      c,b.leftForeArm,
      PLAYER_AXIS_UP,
      foreYaw
    );
    addPlayerBoneAxisRotation(
      c,b.rightForeArm,
      PLAYER_AXIS_UP,
      -foreYaw
    );

    addPlayerBoneAxisRotation(
      c,b.leftArm,
      PLAYER_AXIS_RIGHT,
      armFollow
    );
    addPlayerBoneAxisRotation(
      c,b.rightArm,
      PLAYER_AXIS_RIGHT,
      -armFollow
    );


    const shoulderFollow=
      THREE.MathUtils.degToRad(PLAYER_HAND_TUNING.turnShoulderFollowDeg)*
      turnHandWave;

    addPlayerBoneAxisRotation(
      c,b.leftShoulder,
      PLAYER_AXIS_RIGHT,
      shoulderFollow
    );
    addPlayerBoneAxisRotation(
      c,b.rightShoulder,
      PLAYER_AXIS_RIGHT,
      -shoulderFollow
    );


    const torsoFollow=
      THREE.MathUtils.degToRad(.58)*
      turnHandWave;

    const neckFollow=
      THREE.MathUtils.degToRad(.30)*
      turnHandTwist;

    addPlayerBoneAxisRotation(
      c,b.spine1,
      PLAYER_AXIS_UP,
      torsoFollow
    );
    addPlayerBoneAxisRotation(
      c,b.spine2,
      PLAYER_AXIS_UP,
      torsoFollow*.72
    );
    addPlayerBoneAxisRotation(
      c,b.neck,
      PLAYER_AXIS_UP,
      neckFollow
    );
    addPlayerBoneAxisRotation(
      c,b.head,
      PLAYER_AXIS_UP,
      neckFollow*.40
    );
  }

  const comboTurnForHands=!lateralTurnOnly && Math.abs(strafe)>0.01 && Math.abs(direction)>0.01;
  applyPlayerRealFingerCurl(c,state,lateralTurnOnly,comboTurnForHands);
  if(AD_CURRENT_FRAME_ACTIVE){
    const scaleFromRest=(bone,amount)=>{
      const rest=state.restQ?.get(bone);
      if(!bone||!rest||Math.abs(amount-1)<.000001)return;
      bone.quaternion.slerpQuaternions(rest,bone.quaternion,amount);
    };
    [b.leftUpLeg,b.rightUpLeg,b.leftKnee,b.rightKnee].forEach(x=>scaleFromRest(x,AD_CURRENT.legMotionScale));
    [b.leftFoot,b.rightFoot,b.leftToe,b.rightToe].forEach(x=>scaleFromRest(x,AD_CURRENT.footMotionScale));
    [b.hips,b.spine,b.spine1,b.spine2,b.neck,b.head].forEach(x=>scaleFromRest(x,AD_CURRENT.bodyWalkScale));
    [b.leftShoulder,b.rightShoulder,b.leftArm,b.rightArm,b.leftForeArm,b.rightForeArm,b.leftHand,b.rightHand].forEach(x=>scaleFromRest(x,AD_CURRENT.baseArmAnimationScale));
  }
  c.model.updateMatrixWorld(true);
  solvePlayerFloorCollision(c,state);
}

const PLAYER_SOFT_TURN_STATE=new WeakMap();

function getPlayerSoftTurnState(c){
  let state=PLAYER_SOFT_TURN_STATE.get(c);
  if(!state){
    state={
      targetYaw:0,
      amount:0
    };
    PLAYER_SOFT_TURN_STATE.set(c,state);
  }
  return state;
}


function softenPlayerADPivotFoot(c,sideInput){
  if(!c?.ready || !sideInput) return;

  const state=getPlayerProceduralState(c);
  const b=state?.bones;
  if(!b) return;


  const pivotFoot=sideInput<0 ? b.leftFoot : b.rightFoot;
  if(!pivotFoot) return;

  const restQ=state.restQ?.get(pivotFoot);
  if(!restQ) return;


  const PIVOT_FOOT_MOTION=AD_CURRENT.pivotMotion;

  pivotFoot.quaternion.slerpQuaternions(
    restQ,
    pivotFoot.quaternion,
    PIVOT_FOOT_MOTION
  );
}

function applyPlayerSoftDirectionalTurn(c,targetYaw){

  const AD_ARM_MOTION_SCALE=AD_CURRENT.turnArmOverlayScale; 

  if(!c?.ready || !c?.root || !c?.model) return false;

  const root=c.root;
  const procedural=getPlayerProceduralState(c);
  const b=procedural.bones;
  const state=getPlayerSoftTurnState(c);

  state.targetYaw=targetYaw;

  const delta=normalizeAngle(targetYaw-root.rotation.y);
  const absDelta=Math.abs(delta);

  if(absDelta<THREE.MathUtils.degToRad(AD_CURRENT.snapDeg)){
    root.rotation.y=targetYaw;
    state.amount=THREE.MathUtils.lerp(state.amount,0,.18);
    return false;
  }

  const direction=Math.sign(delta)||1;
  const turnStrength=THREE.MathUtils.clamp(
    absDelta/THREE.MathUtils.degToRad(AD_CURRENT.fullStrengthDeg),
    0,
    1
  );


  const rootTurnLerp=THREE.MathUtils.lerp(
    AD_CURRENT.rootLerpMin,
    AD_CURRENT.rootLerpMax,
    turnStrength
  );

  root.rotation.y=lerpAngle(
    root.rotation.y,
    targetYaw,
    rootTurnLerp
  );

  state.amount=THREE.MathUtils.lerp(
    state.amount,
    direction*turnStrength,
    AD_CURRENT.bodyResponseLerp
  );

  const a=state.amount;


  addPlayerBoneAxisRotation(
    c,b.hips,
    PLAYER_AXIS_UP,
    a*.032
  );

  addPlayerBoneAxisRotation(
    c,b.spine,
    PLAYER_AXIS_UP,
    a*.046
  );

  addPlayerBoneAxisRotation(
    c,b.spine1,
    PLAYER_AXIS_UP,
    a*.034
  );

  addPlayerBoneAxisRotation(
    c,b.spine2,
    PLAYER_AXIS_UP,
    a*.011
  );

  addPlayerBoneAxisRotation(
    c,b.neck,
    PLAYER_AXIS_UP,
    a*.024
  );

  addPlayerBoneAxisRotation(
    c,b.head,
    PLAYER_AXIS_UP,
    a*.024
  );


  addPlayerBoneAxisRotation(
    c,b.hips,
    PLAYER_AXIS_FORWARD,
    -a*.008
  );

  addPlayerBoneAxisRotation(
    c,b.spine,
    PLAYER_AXIS_FORWARD,
    -a*.012
  );

  addPlayerBoneAxisRotation(
    c,b.spine1,
    PLAYER_AXIS_FORWARD,
    -a*.008
  );

  addPlayerBoneAxisRotation(
    c,b.neck,
    PLAYER_AXIS_FORWARD,
    -a*.006
  );


  addPlayerBoneAxisRotation(
    c,b.leftShoulder,
    PLAYER_AXIS_FORWARD,
    a*(.016*AD_ARM_MOTION_SCALE)
  );

  addPlayerBoneAxisRotation(
    c,b.rightShoulder,
    PLAYER_AXIS_FORWARD,
    -a*(.011*AD_ARM_MOTION_SCALE)
  );

  addPlayerBoneAxisRotation(
    c,b.leftShoulder,
    PLAYER_AXIS_UP,
    a*(.012*AD_ARM_MOTION_SCALE)
  );

  addPlayerBoneAxisRotation(
    c,b.rightShoulder,
    PLAYER_AXIS_UP,
    a*(.018*AD_ARM_MOTION_SCALE)
  );

  addPlayerBoneAxisRotation(
    c,b.leftArm,
    PLAYER_AXIS_UP,
    -a*(.018*AD_ARM_MOTION_SCALE)
  );

  addPlayerBoneAxisRotation(
    c,b.rightArm,
    PLAYER_AXIS_UP,
    -a*(.018*AD_ARM_MOTION_SCALE)
  );

  addPlayerBoneAxisRotation(
    c,b.leftForeArm,
    PLAYER_AXIS_UP,
    a*(.026*AD_ARM_MOTION_SCALE)
  );

  addPlayerBoneAxisRotation(
    c,b.rightForeArm,
    PLAYER_AXIS_UP,
    a*(.026*AD_ARM_MOTION_SCALE)
  );

  addPlayerBoneAxisRotation(
    c,b.leftForeArm,
    PLAYER_AXIS_FORWARD,
    a*(.010*AD_ARM_MOTION_SCALE)
  );

  addPlayerBoneAxisRotation(
    c,b.rightForeArm,
    PLAYER_AXIS_FORWARD,
    -a*(.010*AD_ARM_MOTION_SCALE)
  );

  addPlayerBoneAxisRotation(
    c,b.leftHand,
    PLAYER_AXIS_UP,
    a*(.014*AD_ARM_MOTION_SCALE)
  );

  addPlayerBoneAxisRotation(
    c,b.rightHand,
    PLAYER_AXIS_UP,
    a*(.021*AD_ARM_MOTION_SCALE)
  );

  addPlayerBoneAxisRotation(
    c,b.leftHand,
    PLAYER_AXIS_FORWARD,
    a*(.014*AD_ARM_MOTION_SCALE)
  );

  addPlayerBoneAxisRotation(
    c,b.rightHand,
    PLAYER_AXIS_FORWARD,
    -a*(.014*AD_ARM_MOTION_SCALE)
  );

  c.model.updateMatrixWorld(true);
  return true;
}

function applyPlayerForwardWalkingTurn(c,targetYaw){
  if(!c?.ready || !c?.root || !c?.model) return false;

  const root=c.root;
  const procedural=getPlayerProceduralState(c);
  const b=procedural.bones;
  const state=getPlayerSoftTurnState(c);

  const delta=normalizeAngle(targetYaw-root.rotation.y);
  const absDelta=Math.abs(delta);

  if(absDelta<THREE.MathUtils.degToRad(PLAYER_TURN_TUNING.forwardSnapThresholdDeg)){
    root.rotation.y=targetYaw;
    state.amount=THREE.MathUtils.lerp(
      state.amount,
      0,
      .10
    );
    return false;
  }

  const direction=Math.sign(delta)||1;

  const turnStrength=THREE.MathUtils.clamp(
    absDelta/THREE.MathUtils.degToRad(PLAYER_TURN_TUNING.forwardFullStrengthDeg),
    0,
    1
  );


  const rootTurnLerp=THREE.MathUtils.lerp(
    PLAYER_TURN_TUNING.forwardTurnLerpMin,
    PLAYER_TURN_TUNING.forwardTurnLerpMax,
    turnStrength
  );

  root.rotation.y=lerpAngle(
    root.rotation.y,
    targetYaw,
    rootTurnLerp
  );


  const targetBody=
    direction*
    turnStrength*
    PLAYER_TURN_TUNING.forwardBodyTarget;

  state.amount=THREE.MathUtils.lerp(
    state.amount,
    targetBody,
    PLAYER_TURN_TUNING.forwardBodyLerp
  );

  const a=state.amount;

  addPlayerBoneAxisRotation(
    c,b.hips,
    PLAYER_AXIS_UP,
    a*.018
  );

  addPlayerBoneAxisRotation(
    c,b.spine,
    PLAYER_AXIS_UP,
    a*.026
  );

  addPlayerBoneAxisRotation(
    c,b.spine1,
    PLAYER_AXIS_UP,
    a*.024
  );

  addPlayerBoneAxisRotation(
    c,b.spine2,
    PLAYER_AXIS_UP,
    a*.016
  );

  addPlayerBoneAxisRotation(
    c,b.neck,
    PLAYER_AXIS_UP,
    a*.012
  );

  addPlayerBoneAxisRotation(
    c,b.head,
    PLAYER_AXIS_UP,
    a*.006
  );


  addPlayerBoneAxisRotation(
    c,b.leftShoulder,
    PLAYER_AXIS_FORWARD,
    a*.006
  );

  addPlayerBoneAxisRotation(
    c,b.rightShoulder,
    PLAYER_AXIS_FORWARD,
    -a*.006
  );

  c.model.updateMatrixWorld(true);
  return true;
}

function applyPlayerDialogueFist(c,state,amount,phase){
  const fingers=state.fingers||[];
  if(!fingers.length || amount<=.0001) return;


  const talkPulse=(Math.sin(phase*.82)+1)*.5;

  for(const f of fingers){
    if(!f?.bone || !state.restQ.has(f.bone)) continue;

    const n=String(f.name||"").toLowerCase();
    const isThumb=f.finger==="thumb" || n.includes("thumb");

    const segmentMatch=n.match(
      /(?:thumb|index|middle|ring|pinky|little)[^0-9]*([1-4])/
    );
    const segment=segmentMatch ? Number(segmentMatch[1]) : 2;

    const segmentGain=
      segment<=1 ? .72 :
      segment===2 ? 1.00 :
      segment===3 ? 1.12 :
      1.18;


    const relaxed=isThumb ? .035 : .060;
    const closeAmount=isThumb ? .105 : .185;

    const curl=
      (relaxed+talkPulse*closeAmount)*
      segmentGain*
      amount;

    const sideSign=f.side==="left" ? 1 : -1;

    setPlayerBoneAxisRotation(
      c,
      state,
      f.bone,
      PLAYER_AXIS_RIGHT,
      curl*sideSign
    );
  }
}

function animatePlayerProceduralIdle(c){
  if(!c.ready || !c.model) return;
  const cfg=PLAYER_PROCEDURAL_WALK_CONFIG;
  const state=getPlayerProceduralState(c);
  const now=performance.now();
  state.lastTime=now;
  const previousPose=capturePlayerPose(state);
  restorePlayerProceduralPose(state);
  applyPlayerOldArms(c,state,state.phase,false);

  const idleSeconds=now*0.001;
  const idleSlow=Math.sin(idleSeconds*1.15);
  const idleBreath=Math.sin(idleSeconds*1.85);
  const idleMicro=Math.sin(idleSeconds*0.63);

  const dialogueFistTarget=
    (QUEST.dialogueActive || GLOBAL_DIALOGUE_LOCK.active)
      ? 1
      : 0;

  state.dialogueFistAmount=THREE.MathUtils.lerp(
    state.dialogueFistAmount||0,
    dialogueFistTarget,
    dialogueFistTarget ? .18 : .12
  );
  setPlayerBoneAxisRotation(
    c,state,state.bones.spine,PLAYER_AXIS_RIGHT,
    idleBreath*0.006
  );
  addPlayerBoneAxisRotation(
    c,state,state.bones.spine,PLAYER_AXIS_UP,
    idleSlow*0.0035
  );
  setPlayerBoneAxisRotation(
    c,state,state.bones.spine1,PLAYER_AXIS_RIGHT,
    idleBreath*0.0045
  );
  addPlayerBoneAxisRotation(
    c,state,state.bones.spine1,PLAYER_AXIS_UP,
    -idleSlow*0.0028
  );
  setPlayerBoneAxisRotation(
    c,state,state.bones.spine2,PLAYER_AXIS_RIGHT,
    idleBreath*0.003
  );
  addPlayerBoneAxisRotation(
    c,state,state.bones.spine2,PLAYER_AXIS_UP,
    idleMicro*0.002
  );
  setPlayerBoneAxisRotation(
    c,state,state.bones.neck,PLAYER_AXIS_UP,
    -idleSlow*0.002
  );
  setPlayerBoneAxisRotation(
    c,state,state.bones.head,PLAYER_AXIS_UP,
    idleMicro*0.0015
  );
  if(state.bones.spine && state.restP.has(state.bones.spine)){
    state.bones.spine.position.copy(state.restP.get(state.bones.spine));
    state.bones.spine.position.y+=idleBreath*0.0035;
  }

  applyPlayerDialogueFist(
    c,
    state,
    state.dialogueFistAmount,
    idleSeconds
  );

  blendPlayerPoseFromSnapshot(
    state,
    previousPose,
    cfg.stopPoseLerp,
    cfg.stopPositionLerp
  );
  c.model.updateMatrixWorld(true);
  solvePlayerFloorCollision(c,state);
}

  return {
    animatePlayerWalk,
    animatePlayerProceduralIdle,
    softenPlayerADPivotFoot,
    applyPlayerSoftDirectionalTurn,
    applyPlayerForwardWalkingTurn,

    getPlayerProceduralState,
    getPlayerSoftTurnState,
    PLAYER_AXIS_RIGHT,
    PLAYER_AXIS_UP,
    PLAYER_AXIS_FORWARD,
    setPlayerBoneAxisRotation,
    addPlayerBoneAxisRotation,

    setADCurrentFrameActive,
    resetPlayerProceduralState
  };
}
