export function createCasinoBoyController(ctx,CASINO_BOY){
  const THREE=ctx.THREE;

  const normalizeAngle=(angle)=>{
    return Math.atan2(Math.sin(angle),Math.cos(angle));
  };
  const fitToPlayerHeight=(model)=>{
    const THREE=ctx.THREE;
    if(!model) return false;
    model.updateMatrixWorld(true);
    const sourceBox=new THREE.Box3().setFromObject(model);
    const sourceH=sourceBox.getSize(new THREE.Vector3()).y;
    if(!Number.isFinite(sourceH) || sourceH<=.001) return false;

    let targetH=2.05;
    if(ctx.player?.model && ctx.player?.ready){
      ctx.player.model.updateMatrixWorld(true);
      const pb=new THREE.Box3().setFromObject(ctx.player.model);
      const ph=pb.getSize(new THREE.Vector3()).y;
      if(Number.isFinite(ph) && ph>.001){
        targetH=ph;
      }
    }

    model.scale.multiplyScalar(targetH/sourceH);
    model.updateMatrixWorld(true);
    return true;
  };



function casinoBoyFindBone(root,names){
  for(const name of names){
    const exact=root.getObjectByName(name);
    if(exact) return exact;
  }

  const norm=s=>String(s||"")
    .toLowerCase()
    .replace(/mixamorig/g,"")
    .replace(/[^a-z0-9]/g,"");

  const all=[];
  root.traverse(o=>{
    if(o?.isBone) all.push(o);
  });

  const wanted=names.map(norm);

  for(const w of wanted){
    const exact=all.find(b=>norm(b.name)===w);
    if(exact) return exact;
  }

  for(const w of wanted){
    const fuzzy=all.find(b=>{
      const n=norm(b.name);
      return n.includes(w) || n.endsWith(w);
    });
    if(fuzzy) return fuzzy;
  }

  return null;
}
function casinoBoyBuildRig(root){
  return {
    hips:casinoBoyFindBone(root,["mixamorig:Hips_01","mixamorig:Hips","Hips"]),

    spine:casinoBoyFindBone(root,["mixamorig:Spine_02","mixamorig:Spine","Spine"]),
    spine1:casinoBoyFindBone(root,["mixamorig:Spine1_03","mixamorig:Spine1","Spine1"]),
    spine2:casinoBoyFindBone(root,["mixamorig:Spine2_04","mixamorig:Spine2","Spine2"]),

    neck:casinoBoyFindBone(root,["mixamorig:Neck_05","mixamorig:Neck","Neck"]),
    head:casinoBoyFindBone(root,["mixamorig:Head_06","mixamorig:Head","Head"]),

    leftShoulder:casinoBoyFindBone(root,["mixamorig:LeftShoulder_08","mixamorig:LeftShoulder","LeftShoulder"]),
    leftArm:casinoBoyFindBone(root,["mixamorig:LeftArm_09","mixamorig:LeftArm","LeftArm"]),
    leftForeArm:casinoBoyFindBone(root,["mixamorig:LeftForeArm_010","mixamorig:LeftForeArm","LeftForeArm"]),
    leftHand:casinoBoyFindBone(root,["mixamorig:LeftHand_011","mixamorig:LeftHand","LeftHand"]),

    rightShoulder:casinoBoyFindBone(root,["mixamorig:RightShoulder_032","mixamorig:RightShoulder","RightShoulder"]),
    rightArm:casinoBoyFindBone(root,["mixamorig:RightArm_033","mixamorig:RightArm","RightArm"]),
    rightForeArm:casinoBoyFindBone(root,["mixamorig:RightForeArm_034","mixamorig:RightForeArm","RightForeArm"]),
    rightHand:casinoBoyFindBone(root,["mixamorig:RightHand_035","mixamorig:RightHand","RightHand"]),

    leftUpLeg:casinoBoyFindBone(root,["mixamorig:LeftUpLeg_055","mixamorig:LeftUpLeg","LeftUpLeg"]),
    leftKnee:casinoBoyFindBone(root,["mixamorig:LeftLeg_056","mixamorig:LeftLeg","LeftLeg"]),
    leftFoot:casinoBoyFindBone(root,["mixamorig:LeftFoot_057","mixamorig:LeftFoot","LeftFoot"]),

    rightUpLeg:casinoBoyFindBone(root,["mixamorig:RightUpLeg_060","mixamorig:RightUpLeg","RightUpLeg"]),
    rightKnee:casinoBoyFindBone(root,["mixamorig:RightLeg_061","mixamorig:RightLeg","RightLeg"]),
    rightFoot:casinoBoyFindBone(root,["mixamorig:RightFoot_062","mixamorig:RightFoot","RightFoot"])
  };
}
function casinoBoyCaptureRest(){
  CASINO_BOY.rest.clear();

  for(const bone of Object.values(CASINO_BOY.bones)){
    if(bone?.isBone){
      CASINO_BOY.rest.set(bone,bone.quaternion.clone());
    }
  }
}
function loadCasinoBoy(){
  ctx.loadGLBFromCandidates(
    [new URL("assets/models/boy.glb", document.baseURI).href],
    (gltf,path)=>{
      const boy=gltf.scene;
      boy.name="casino_boy_gambler";

      ctx.cloneMaterials?.(boy);
      boy.scale.set(1,1,1);
      ctx.centerModelXZ?.(boy);
      fitToPlayerHeight(boy);
      ctx.putModelOnFloor?.(boy,0);

      boy.scale.copy(CASINO_BOY.scale);
      boy.position.copy(CASINO_BOY.position);
      boy.rotation.copy(CASINO_BOY.rotation);

      boy.visible=true;
      ctx.scene.add(boy);

      CASINO_BOY.root=boy;
      CASINO_BOY.bones=casinoBoyBuildRig(boy);
      casinoBoyCaptureRest();

      ctx.registerCasinoEditable?.("casinoBoy",boy);
      ctx.onLoaded?.(boy);

      CASINO_BOY.talking=false;
    },
    err=>console.error("boy.glb load error",err)
  );
}
function casinoBoySmooth01(t){
  t=THREE.MathUtils.clamp(t,0,1);
  return t*t*(3-2*t);
}
function casinoBoyLerpVec(a,b,t){
  return [
    THREE.MathUtils.lerp(a?.[0]||0,b?.[0]||0,t),
    THREE.MathUtils.lerp(a?.[1]||0,b?.[1]||0,t),
    THREE.MathUtils.lerp(a?.[2]||0,b?.[2]||0,t)
  ];
}
function casinoBoyTargetQuaternion(bone,deg){
  const rest=CASINO_BOY.rest.get(bone);
  if(!bone || !rest) return null;

  return rest.clone().multiply(
    new THREE.Quaternion().setFromEuler(
      new THREE.Euler(
        THREE.MathUtils.degToRad(deg?.[0]||0),
        THREE.MathUtils.degToRad(deg?.[1]||0),
        THREE.MathUtils.degToRad(deg?.[2]||0),
        "XYZ"
      )
    )
  );
}
function casinoBoySetBone(bone,deg,k){
  if(!bone) return;

  const target=casinoBoyTargetQuaternion(bone,deg);
  if(!target) return;

  bone.quaternion.slerp(target,k);
}
function casinoBoyApplyUpperPose(pose,extra=null,k=ctx.CASINO_BOY_ANIM.poseLerp){
  const b=CASINO_BOY.bones;

  for(const key of [
    "spine2",
    "leftShoulder","leftArm","leftForeArm","leftHand",
    "rightShoulder","rightArm","rightForeArm","rightHand",
    "neck","head"
  ]){
    const p=pose?.[key]||[0,0,0];
    const e=extra?.[key]||[0,0,0];

    casinoBoySetBone(
      b[key],
      [
        (p[0]||0)+(e[0]||0),
        (p[1]||0)+(e[1]||0),
        (p[2]||0)+(e[2]||0)
      ],
      k
    );
  }
}
function casinoBoyLookAtPlayerWithHeadOnly(now){
  const root=CASINO_BOY.root;
  const b=CASINO_BOY.bones;

  if(!root || !ctx.player?.root) return;

  const boyPos=new THREE.Vector3();
  const playerPos=new THREE.Vector3();

  root.getWorldPosition(boyPos);
  ctx.player.root.getWorldPosition(playerPos);

  const worldYaw=Math.atan2(
    playerPos.x-boyPos.x,
    playerPos.z-boyPos.z
  );

  const baseYaw=CASINO_BOY.rotation.y;
  const localYaw=normalizeAngle(worldYaw-baseYaw);
  const localDeg=THREE.MathUtils.radToDeg(localYaw);

  const bodyTurnDeg=THREE.MathUtils.clamp(
    localDeg*ctx.CASINO_BOY_ANIM.talkBodyTurnFactor,
    -ctx.CASINO_BOY_ANIM.talkBodyTurnMaxDeg,
    ctx.CASINO_BOY_ANIM.talkBodyTurnMaxDeg
  );

  const targetRootYaw=
    baseYaw +
    THREE.MathUtils.degToRad(bodyTurnDeg);

  root.rotation.y +=
    normalizeAngle(
      targetRootYaw-root.rotation.y
    )*.075;

  const remainingDeg=localDeg-bodyTurnDeg;

  const neckYaw=THREE.MathUtils.clamp(
    remainingDeg*.35,
    -24,
    24
  );

  const headYaw=THREE.MathUtils.clamp(
    remainingDeg*.62,
    -40,
    40
  );

  const nod=Math.sin(now*2.0)*.8;

  casinoBoySetBone(
    b.neck,
    [nod*.42,neckYaw,0],
    .10
  );

  casinoBoySetBone(
    b.head,
    [nod,headYaw,0],
    .11
  );
}
function casinoBoyAnimateFingers(now,blend){
  const b=CASINO_BOY.bones;
  const pulse=(Math.sin(now*1.15)+1)*.5;

  const leftCurl=.08 + pulse*.05 + blend*.03;
  const rightCurl=.07 + (1-pulse)*.04 + blend*.025;

  const fingerGroups=[
    ["left",leftCurl],
    ["right",rightCurl]
  ];

  for(const [side,curl] of fingerGroups){
    for(const name of [
      `${side}Index1`,`${side}Index2`,`${side}Index3`,
      `${side}Middle1`,`${side}Middle2`,`${side}Middle3`,
      `${side}Ring1`,`${side}Ring2`,`${side}Ring3`,
      `${side}Pinky1`,`${side}Pinky2`,`${side}Pinky3`
    ]){
      const bone=b[name];
      if(!bone) continue;
      const rest=ctx.getRest(CASINO_BOY,bone);
      ctx.smoothBoneTo(
        bone,
        rest.x+curl,
        rest.y,
        rest.z,
        .045
      );
    }
  }
}
function casinoBoyCaptureTalkLowerBody(){
  const b=CASINO_BOY.bones;
  CASINO_BOY.talkLowerBodyLock={};
  for(const key of [
    "leftUpLeg","rightUpLeg","leftKnee","rightKnee",
    "leftFoot","rightFoot","leftToe","rightToe"
  ]){
    const bone=b?.[key];
    if(bone) CASINO_BOY.talkLowerBodyLock[key]=bone.quaternion.clone();
  }
}
function casinoBoyHoldTalkLowerBody(){
  const lock=CASINO_BOY.talkLowerBodyLock;
  if(!lock) return;
  for(const [key,q] of Object.entries(lock)){
    const bone=CASINO_BOY.bones?.[key];
    if(bone && q) bone.quaternion.copy(q);
  }
}
function updateCasinoBoyProcedural(dt){
  const root=CASINO_BOY.root;
  if(!root) return;

  root.position.copy(CASINO_BOY.position);
  root.scale.copy(CASINO_BOY.scale);

  const now=performance.now()*.001;

  const talking=
    ctx.QUEST?.dialogueActive &&
    ctx.QUEST?.dialogueSpeaker==="BOY";

  if(!talking){
    root.rotation.x=THREE.MathUtils.lerp(
      root.rotation.x,
      CASINO_BOY.rotation.x,
      .10
    );
    root.rotation.y +=
      normalizeAngle(
        CASINO_BOY.rotation.y-root.rotation.y
      )*.10;
    root.rotation.z=THREE.MathUtils.lerp(
      root.rotation.z,
      CASINO_BOY.rotation.z,
      .10
    );
  }

  const wasTalking=CASINO_BOY.talking;
  if(talking && !wasTalking){
    casinoBoyCaptureTalkLowerBody();
  }else if(!talking && wasTalking){
    CASINO_BOY.talkLowerBodyLock=null;
  }
  CASINO_BOY.talking=talking;

  if(!talking){

    const cycleSeconds=13.2;
    const u=((now%cycleSeconds)+cycleSeconds)%cycleSeconds/cycleSeconds;

    let blend;

    if(u<.31){
      blend=0;
    }else if(u<.46){
      blend=casinoBoySmooth01((u-.31)/.15);
    }else if(u<.78){
      blend=1;
    }else if(u<.93){
      blend=1-casinoBoySmooth01((u-.78)/.15);
    }else{
      blend=0;
    }

    const pose={};

    for(const key of [
      "spine2",
      "leftShoulder","leftArm","leftForeArm","leftHand",
      "rightShoulder","rightArm","rightForeArm","rightHand",
      "leftUpLeg","rightUpLeg",
      "leftKnee","rightKnee",
      "leftFoot","rightFoot",
      "leftToe","rightToe",
      "neck","head"
    ]){
      pose[key]=casinoBoyLerpVec(
        ctx.CASINO_BOY_STANDARD_POSE[key],
        ctx.CASINO_BOY_GESTURE_POSE[key],
        blend
      );
    }

    const a=Math.sin(now*1.55);
    const c=Math.sin(now*1.10+.65);
    const breath=Math.sin(now*.72);
    const micro=Math.sin(now*1.85+.35);
    const micro2=Math.sin(now*1.35+1.1);

    casinoBoyApplyUpperPose(
      pose,
      {
        spine2:[
          a*ctx.CASINO_BOY_ANIM.torsoX + breath*.55,
          c*ctx.CASINO_BOY_ANIM.torsoY + micro*.28,
          breath*.20
        ],
        neck:[
          a*.55 + breath*.18,
          c*.24,
          micro2*.16
        ],
        head:[
          a*ctx.CASINO_BOY_ANIM.headX + micro*.55,
          c*ctx.CASINO_BOY_ANIM.headY + micro2*.42,
          micro*.20
        ],
        leftShoulder:[
          breath*.28,
          0,
          micro*.34
        ],
        rightShoulder:[
          -breath*.24,
          0,
          -micro*.28
        ],
        leftHand:[
          micro*.38,
          micro2*.22,
          breath*.18
        ],
        rightHand:[
          -micro*.32,
          -micro2*.18,
          -breath*.15
        ]
      }
    );

    const transitionAmount=
      blend>0 && blend<1
        ? Math.sin(blend*Math.PI)
        : 0;

    const stepWave=Math.sin(now*2.2);
    const stepWaveOpp=Math.sin(now*2.2+Math.PI);

    const leftLift=Math.max(0,stepWave)*transitionAmount;
    const rightLift=Math.max(0,stepWaveOpp)*transitionAmount;

    casinoBoySetBone(
      CASINO_BOY.bones.leftUpLeg,
      [leftLift*1.8,0,leftLift*.35],
      .075
    );

    casinoBoySetBone(
      CASINO_BOY.bones.rightUpLeg,
      [rightLift*1.5,0,-rightLift*.28],
      .075
    );

    casinoBoySetBone(
      CASINO_BOY.bones.leftKnee,
      [leftLift*2.2,0,0],
      .075
    );

    casinoBoySetBone(
      CASINO_BOY.bones.rightKnee,
      [rightLift*1.9,0,0],
      .075
    );

    casinoBoySetBone(
      CASINO_BOY.bones.leftFoot,
      [-leftLift*.55,0,0],
      .07
    );

    casinoBoySetBone(
      CASINO_BOY.bones.rightFoot,
      [-rightLift*.48,0,0],
      .07
    );

    casinoBoySetBone(
      CASINO_BOY.bones.leftToe,
      [leftLift*.22,0,0],
      .065
    );

    casinoBoySetBone(
      CASINO_BOY.bones.rightToe,
      [rightLift*.20,0,0],
      .065
    );

    casinoBoyAnimateFingers(now,blend);
  }else{

    casinoBoyApplyUpperPose(
      ctx.CASINO_BOY_STANDARD_POSE,
      null,
      .11
    );

    casinoBoyHoldTalkLowerBody();

    casinoBoyAnimateFingers(now,0);

    casinoBoyLookAtPlayerWithHeadOnly(now);
  }

  root.updateMatrixWorld(true);
}
  return {
    load:loadCasinoBoy,
    update:updateCasinoBoyProcedural
  };
}
