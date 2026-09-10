// ChildPoseSystem.js
// Child talk/pose flow only. Wall geometry and all camera logic remain in main.js.

export function createChildPoseSystem(ctx){

const CHILD_VISIT_POSE_STATE={
  talkStart:0,
  talkStartPos:null,
  talkPoseLatched:false,
  stableYaw:null
};

const CHILD_ADVANCED_TALK_STATE=new WeakMap();

const CHILD_NEW_TALK_STATE=new WeakMap();

function animateChildNewTalk(c){
  if(!c?.ready || !c?.root) return;

  const stillTurning=ctx.turnNpcTowardPlayerWithSteps(c,.12);

  let s=CHILD_USER_POSE_FLOW_STATE.get(c);
  if(!s){
    childUserStartPoseFlow(c);
    s=CHILD_USER_POSE_FLOW_STATE.get(c);
  }

  const now=performance.now();

  if(
    s?.stepStartPos &&
    s?.stepTargetPos &&
    !s.stepDone
  ){
    const elapsed=now-s.start;

    const stepRaw=ctx.THREE.MathUtils.clamp(
      elapsed/(ctx.CHILD_USER_POSE_FLOW.enterMs*.72),
      0,
      1
    );
    const stepT=childUserSmooth01(stepRaw);

    c.root.position.lerpVectors(
      s.stepStartPos,
      s.stepTargetPos,
      stepT
    );

    if(stepRaw>=1){
      s.stepDone=true;
    }
  }

  if(s.phase==="enter"){
    const raw=(now-s.start)/ctx.CHILD_USER_POSE_FLOW.enterMs;
    const t=childUserSmooth01(raw);

    const p=childUserLerpPose(
      s.from,
      ctx.CHILD_USER_POSE_1,
      t
    );

    p.leftFingerCurl=ctx.THREE.MathUtils.lerp(
      s.from?.leftFingerCurl||0,
      ctx.CHILD_USER_POSE_1.leftFingerCurl||0,
      t
    );
    p.rightFingerCurl=ctx.THREE.MathUtils.lerp(
      s.from?.rightFingerCurl||0,
      ctx.CHILD_USER_POSE_1.rightFingerCurl||0,
      t
    );

    p.head=[
      Math.sin(t*Math.PI)*.75,
      Math.sin(t*Math.PI*.85)*.30,
      0
    ];
    p.neck=[
      Math.sin(t*Math.PI)*.35,
      Math.sin(t*Math.PI*.85)*.14,
      0
    ];

    childUserApplyPose(c,p);

    childUserApplyLegTurnOverlay(c,t*.55);

    if(raw>=1){
      s.phase="talk";
      s.start=now;
    }
    return;
  }

  if(s.phase==="talk"){
    const seconds=(now-s.start)/1000;

    const sine=
      (Math.sin(
        seconds*(Math.PI*2/ctx.CHILD_USER_POSE_FLOW.cycleSeconds)
        - Math.PI/2
      )+1)*.5;

    const blend=childUserSmooth01(sine);

    const p=childUserLerpPose(
      ctx.CHILD_USER_POSE_1,
      ctx.CHILD_USER_POSE_2,
      blend
    );

    const a=Math.sin(seconds*1.55);
    const b=Math.sin(seconds*1.25+.75);
    const c2=Math.sin(seconds*.95+1.25);

    p.leftArm[0]+=a*ctx.CHILD_USER_POSE_FLOW.armShake*.12;
    p.rightArm[0]+=a*ctx.CHILD_USER_POSE_FLOW.armShake*.12;

    p.leftForeArm[0]+=b*ctx.CHILD_USER_POSE_FLOW.foreShake*.10;
    p.leftForeArm[2]+=a*.07;

    p.rightForeArm[0]+=b*.09;
    p.rightForeArm[2]-=a*.06;

    p.leftHand[0]+=a*.025;
    p.rightHand[0]+=a*.025;

    p.head=[
      a*ctx.CHILD_USER_POSE_FLOW.headNod,
      b*.78,
      c2*.24
    ];
    p.neck=[
      a*ctx.CHILD_USER_POSE_FLOW.neckNod,
      b*.32,
      c2*.10
    ];

    const pulse=(Math.sin(seconds*3.55)+1)*.5;

    p.leftFingerCurl=
      ctx.THREE.MathUtils.lerp(
        ctx.CHILD_USER_POSE_1.leftFingerCurl,
        ctx.CHILD_USER_POSE_2.leftFingerCurl,
        blend
      )
      + pulse*ctx.CHILD_USER_POSE_FLOW.fingerPulse*.02;

    p.rightFingerCurl=
      ctx.THREE.MathUtils.lerp(
        ctx.CHILD_USER_POSE_1.rightFingerCurl,
        ctx.CHILD_USER_POSE_2.rightFingerCurl,
        blend
      )
      + (1-pulse)*ctx.CHILD_USER_POSE_FLOW.fingerPulse*.02;

    childUserApplyPose(c,p);

    const turnP=ctx.THREE.MathUtils.clamp(seconds/1.45,0,1);

    if(stillTurning || turnP<1 || (s?.turnAngleDeg||0)<12){
      childUserApplyLegTurnOverlay(c,turnP);
    }

    return;
  }
}

const CHILD_USER_POSE_FLOW_STATE=new WeakMap();

function childUserSmooth01(v){
  const t=ctx.THREE.MathUtils.clamp(v,0,1);
  return t*t*(3-2*t);
}

function childUserCapturePose(c){
  const b=ctx.getBones(c);
  const out={};

  for(const key of [
    "spine2",
    "leftShoulder","leftArm","leftForeArm","leftHand",
    "rightShoulder","rightArm","rightForeArm","rightHand",
    "neck","head"
  ]){
    const bone=b[key];
    if(!bone) continue;

    const r=ctx.getRest(c,bone);
    if(!r) continue;

    out[key]=[
      ctx.THREE.MathUtils.radToDeg(bone.rotation.x-r.x),
      ctx.THREE.MathUtils.radToDeg(bone.rotation.y-r.y),
      ctx.THREE.MathUtils.radToDeg(bone.rotation.z-r.z)
    ];
  }

  out.leftFingerCurl=0;
  out.rightFingerCurl=0;

  return out;
}

function childUserLerpPose(a,b,t){
  const out={};

  for(const key of [
    "spine2",
    "leftShoulder","leftArm","leftForeArm","leftHand",
    "rightShoulder","rightArm","rightForeArm","rightHand",
    "neck","head"
  ]){
    const av=a?.[key] || [0,0,0];
    const bv=b?.[key] || [0,0,0];

    out[key]=[
      ctx.THREE.MathUtils.lerp(av[0]||0,bv[0]||0,t),
      ctx.THREE.MathUtils.lerp(av[1]||0,bv[1]||0,t),
      ctx.THREE.MathUtils.lerp(av[2]||0,bv[2]||0,t)
    ];
  }

  return out;
}

function childUserFingerBones(c){
  const root=c?.root;
  if(!root) return {left:[],right:[]};

  const norm=s=>String(s||"")
    .toLowerCase()
    .replace(/mixamorig/g,"")
    .replace(/[^a-z0-9]/g,"");

  const left=[];
  const right=[];

  root.traverse(o=>{
    if(!o?.isBone) return;
    const n=norm(o.name);

    if(
      n.includes("lefthandindex1") ||
      n.includes("lefthandmiddle1") ||
      n.includes("lefthandring1") ||
      n.includes("lefthandpinky1")
    ){
      left.push(o);
    }

    if(
      n.includes("righthandindex1") ||
      n.includes("righthandmiddle1") ||
      n.includes("righthandring1") ||
      n.includes("righthandpinky1")
    ){
      right.push(o);
    }
  });

  return {left,right};
}

const CHILD_USER_FINGER_BASE=new WeakMap();

function childUserEnsureFingerBase(c){
  let base=CHILD_USER_FINGER_BASE.get(c);
  if(base) return base;

  const fingers=childUserFingerBones(c);
  base={
    left:new Map(),
    right:new Map()
  };

  for(const bone of fingers.left){
    base.left.set(bone,bone.quaternion.clone());
  }
  for(const bone of fingers.right){
    base.right.set(bone,bone.quaternion.clone());
  }

  CHILD_USER_FINGER_BASE.set(c,base);
  return base;
}

function childUserApplyFingerCurl(c,leftCurl,rightCurl){
  const base=childUserEnsureFingerBase(c);

  const apply=(map,amount)=>{
    for(const [bone,q0] of map){
      if(!bone) continue;

      const qCurl=new ctx.THREE.Quaternion().setFromEuler(
        new ctx.THREE.Euler(
          ctx.THREE.MathUtils.degToRad(
            ctx.THREE.MathUtils.clamp(amount,0,1)*52
          ),
          0,
          0,
          "XYZ"
        )
      );

      bone.quaternion.copy(q0).multiply(qCurl);
    }
  };

  apply(base.left,leftCurl||0);
  apply(base.right,rightCurl||0);
}

function childUserApplyLegTurnOverlay(c,p){
  if(!c?.ready) return;

  const s=CHILD_USER_POSE_FLOW_STATE.get(c);
  const turnAngleDeg=s?.turnAngleDeg||0;

  const b=ctx.getBones(c);

  const turnStrength=ctx.THREE.MathUtils.clamp(
    (turnAngleDeg-12)/55,
    0,
    1
  );

  const phase=ctx.THREE.MathUtils.clamp(p,0,1);

  const leftLift=Math.sin(
    ctx.THREE.MathUtils.clamp(phase*2,0,1)*Math.PI
  );

  const rightPhase=ctx.THREE.MathUtils.clamp(
    (phase-.42)/.58,
    0,
    1
  );
  const rightLift=Math.sin(rightPhase*Math.PI);

  const tiny=Math.sin(performance.now()*.0032)*.28;

  const move=(bone,dx,dy,dz,speed=.12)=>{
    if(!bone) return;
    const r=ctx.getRest(c,bone);
    if(!r) return;

    ctx.smoothBoneTo(
      bone,
      r.x+ctx.THREE.MathUtils.degToRad(dx),
      r.y+ctx.THREE.MathUtils.degToRad(dy),
      r.z+ctx.THREE.MathUtils.degToRad(dz),
      speed
    );
  };

  const legAmp=4.0*turnStrength;

  move(
    b.leftUpLeg,
    leftLift*legAmp + tiny,
    0,
    leftLift*.55*turnStrength,
    .12
  );
  move(
    b.rightUpLeg,
    rightLift*legAmp - tiny,
    0,
    -rightLift*.55*turnStrength,
    .12
  );

  move(
    b.leftKnee,
    leftLift*2.8*turnStrength,
    0,
    0,
    .13
  );
  move(
    b.rightKnee,
    rightLift*2.8*turnStrength,
    0,
    0,
    .13
  );

  move(
    b.leftFoot,
    -leftLift*.85*turnStrength,
    0,
    0,
    .14
  );
  move(
    b.rightFoot,
    -rightLift*.85*turnStrength,
    0,
    0,
    .14
  );
}

function childUserApplyPose(c,pose,extra=null){
  if(!c?.ready) return;

  const b=ctx.getBones(c);

  for(const key of [
    "spine2",
    "leftShoulder","leftArm","leftForeArm","leftHand",
    "rightShoulder","rightArm","rightForeArm","rightHand",
    "neck","head"
  ]){
    const bone=b[key];
    const p=pose?.[key];
    if(!bone || !p) continue;

    ctx.childPoseOffsetTarget(
      c,
      bone,
      p,
      extra?.[key] || [0,0,0]
    );
  }

  childUserApplyFingerCurl(
    c,
    pose?.leftFingerCurl||0,
    pose?.rightFingerCurl||0
  );

  c.root.updateMatrixWorld(true);
}

function childUserStartPoseFlow(c){
  let turnAngleDeg=0;
  let stepStartPos=null;
  let stepTargetPos=null;

  if(c?.root && ctx.player?.root){
    const dx=ctx.player.root.position.x-c.root.position.x;
    const dz=ctx.player.root.position.z-c.root.position.z;

    const targetYaw=Math.atan2(dx,dz);
    const diff=ctx.normalizeAngle(targetYaw-c.root.rotation.y);

    turnAngleDeg=Math.abs(
      ctx.THREE.MathUtils.radToDeg(diff)
    );

    stepStartPos=c.root.position.clone();

    const stepFactor=ctx.THREE.MathUtils.clamp(
      (turnAngleDeg-18)/72,
      0,
      1
    );

    const dir=new ctx.THREE.Vector3(dx,0,dz);
    if(dir.lengthSq()>.0001){
      dir.normalize();

      stepTargetPos=stepStartPos.clone().addScaledVector(
        dir,
        .14*stepFactor
      );
    }else{
      stepTargetPos=stepStartPos.clone();
    }
  }

  CHILD_USER_POSE_FLOW_STATE.set(c,{
    phase:"enter",
    start:performance.now(),
    from:childUserCapturePose(c),

    turnAngleDeg,
    stepStartPos,
    stepTargetPos,
    stepDone:false
  });
}

function childUserBeginReturnPose1(c){
  CHILD_USER_POSE_FLOW_STATE.set(c,{
    phase:"return",
    start:performance.now(),
    from:childUserCapturePose(c)
  });

  CHILD_VISIT_POSE_STATE.talkPoseLatched=true;
}

return {
  CHILD_VISIT_POSE_STATE,
  CHILD_ADVANCED_TALK_STATE,
  CHILD_NEW_TALK_STATE,
  CHILD_USER_POSE_FLOW_STATE,
  CHILD_USER_FINGER_BASE,
  animateChildNewTalk,
  childUserSmooth01,
  childUserCapturePose,
  childUserLerpPose,
  childUserFingerBones,
  childUserEnsureFingerBase,
  childUserApplyFingerCurl,
  childUserApplyLegTurnOverlay,
  childUserApplyPose,
  childUserStartPoseFlow,
  childUserBeginReturnPose1
};
}
