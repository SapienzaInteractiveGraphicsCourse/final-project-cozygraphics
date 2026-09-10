export function createCasinoReceptionistController(ctx){
  const THREE=ctx.THREE;
  let casinoWoman=null;

  const look={
    head:null,neck:null,spine:null,spine2:null,hips:null,
    rightArm:null,rightForeArm:null,rightHand:null,
    leftArm:null,leftForeArm:null,leftHand:null,
    ready:false,rest:new Map(),wasTalking:false,talkStart:0,
    welcomeActive:false,welcomeStart:0,
    baseYaw:THREE.MathUtils.degToRad(116)
  };

  const approvedPose={
    leftShoulder:[0,0,0],
    leftArm:[65,60,7],
    leftForeArm:[28,-23,31],
    leftHand:[0,0,0],
    rightShoulder:[0,0,0],
    rightArm:[81,20,9],
    rightForeArm:[0,0,0],
    rightHand:[0,0,0]
  };

  const poseState={
    rest:new WeakMap(),
    talkStart:0,
    wasTalking:false,
    baseYaw:null,
    manualYawOffset:0,
    postTalkLatched:false
  };

  const poseRest=(b)=>{
    if(!b) return {x:0,y:0,z:0};
    if(!poseState.rest.has(b)){
      poseState.rest.set(b,b.rotation.clone());
    }
    return poseState.rest.get(b);
  };

  const poseBone=(bone,deg,k=.06)=>{
    if(!bone) return;
    const r=poseRest(bone);
    bone.rotation.x=THREE.MathUtils.lerp(
      bone.rotation.x,
      r.x+THREE.MathUtils.degToRad(deg?.[0]||0),
      k
    );
    bone.rotation.y=THREE.MathUtils.lerp(
      bone.rotation.y,
      r.y+THREE.MathUtils.degToRad(deg?.[1]||0),
      k
    );
    bone.rotation.z=THREE.MathUtils.lerp(
      bone.rotation.z,
      r.z+THREE.MathUtils.degToRad(deg?.[2]||0),
      k
    );
  };

  const mirroredPose=()=>({
    leftShoulder:[31,0,0],
    leftArm:[74,-20,0],
    leftForeArm:[7,0,0],
    leftHand:[0,0,0],
    rightShoulder:[0,0,0],
    rightArm:[74,-20,0],
    rightForeArm:[7,0,0],
    rightHand:[0,0,0]
  });

  const findBones=()=>{
    if(!casinoWoman) return false;
    const clean=n=>String(n||"").toLowerCase().replace(/[^a-z0-9]/g,"");
    const all=[];
    casinoWoman.traverse(o=>{ if(o.isBone) all.push(o); });
    const find=(tokens)=>{
      for(const token of tokens){
        const t=clean(token);
        const exact=all.find(b=>clean(b.name)===t);
        if(exact) return exact;
      }
      for(const token of tokens){
        const t=clean(token);
        const partial=all.find(b=>clean(b.name).includes(t));
        if(partial) return partial;
      }
      return null;
    };
    look.head=find(["head06","head"]);
    look.neck=find(["neck"]);
    look.spine=find(["spine02","spine"]);
    look.spine2=find(["spine2"]);
    look.hips=find(["hips"]);
    look.rightArm=find(["rightarm"]);
    look.rightForeArm=find(["rightforearm"]);
    look.rightHand=find(["righthand019","righthand"]);
    look.leftArm=find(["leftarm"]);
    look.leftForeArm=find(["leftforearm"]);
    look.leftHand=find(["lefthand011","lefthand"]);
    for(const k of [
      "head","neck","spine","spine2","hips",
      "rightArm","rightForeArm","rightHand",
      "leftArm","leftForeArm","leftHand"
    ]){
      const b=look[k];
      if(b && !look.rest.has(b)) look.rest.set(b,b.rotation.clone());
    }
    look.ready=!!(
      look.head &&
      look.rightArm &&
      look.rightForeArm &&
      look.rightHand
    );
    look.baseYaw=casinoWoman.rotation.y;
    return look.ready;
  };

  const setInitialPose=()=>{
    if(!casinoWoman) return false;
    if(!look.ready) findBones();
    if(!look.ready) return false;
    const setNow=(bone,deg)=>{
      if(!bone) return;
      const r=poseRest(bone);
      bone.rotation.set(
        r.x+THREE.MathUtils.degToRad(deg?.[0]||0),
        r.y+THREE.MathUtils.degToRad(deg?.[1]||0),
        r.z+THREE.MathUtils.degToRad(deg?.[2]||0)
      );
    };
    const p=approvedPose;
    setNow(look.leftArm,p.leftArm);
    setNow(look.leftForeArm,p.leftForeArm);
    setNow(look.leftHand,p.leftHand);
    setNow(look.rightArm,p.rightArm);
    setNow(look.rightForeArm,p.rightForeArm);
    setNow(look.rightHand,p.rightHand);
    if(look.spine2) setNow(look.spine2,[0,0,0]);
    if(look.neck) setNow(look.neck,[0,0,0]);
    if(look.head) setNow(look.head,[0,0,0]);
    if(poseState.baseYaw===null){
      poseState.baseYaw=casinoWoman.rotation.y;
    }
    casinoWoman.updateMatrixWorld(true);
    return true;
  };

  const fitToPlayerHeight=(model)=>{
    model.updateMatrixWorld(true);
    const sourceBox=new THREE.Box3().setFromObject(model);
    const sourceH=sourceBox.getSize(new THREE.Vector3()).y;
    if(!Number.isFinite(sourceH) || sourceH<=.001) return false;
    let targetH=2.05;
    if(ctx.player?.model && ctx.player?.ready){
      ctx.player.model.updateMatrixWorld(true);
      const pb=new THREE.Box3().setFromObject(ctx.player.model);
      const ph=pb.getSize(new THREE.Vector3()).y;
      if(Number.isFinite(ph) && ph>.001) targetH=ph;
    }
    model.scale.multiplyScalar(targetH/sourceH);
    model.updateMatrixWorld(true);
    return true;
  };

  const load=()=>{
    const cfg=ctx.CASINO_MODEL_CONFIG.receptionist;
    ctx.loadGLBFromCandidates(
      cfg.paths,
      (gltf)=>{
        const woman=gltf.scene;
        woman.name="casino_receptionist_girl";
        ctx.cloneMaterials?.(woman);
        woman.traverse(o=>{
          if(o.isMesh){
            o.castShadow=false;
            o.receiveShadow=true;
            o.frustumCulled=true;
          }
        });
        woman.scale.set(1,1,1);
        ctx.centerModelXZ?.(woman);
        fitToPlayerHeight(woman);
        ctx.putModelOnFloor?.(woman,0);
        woman.position.set(...cfg.position);
        woman.rotation.set(
          ctx.THREE.MathUtils.degToRad(cfg.rotation[0]),
          ctx.THREE.MathUtils.degToRad(cfg.rotation[1]),
          ctx.THREE.MathUtils.degToRad(cfg.rotation[2])
        );
        woman.scale.set(...cfg.scale);
        woman.updateMatrixWorld(true);
        woman.visible=false;
        ctx.scene.add(woman);
        casinoWoman=woman;
        ctx.registerCasinoEditable?.("casinoWoman",woman);

        const reveal=()=>{
          if(setInitialPose()){
            woman.visible=true;
            return true;
          }
          return false;
        };
        if(!reveal()){
          requestAnimationFrame(()=>{
            if(!reveal()){
              setTimeout(()=>{
                reveal();
                woman.visible=true;
              },60);
            }
          });
        }
        setTimeout(findBones,0);
        setTimeout(()=>{findBones();setInitialPose();},300);
        setTimeout(()=>{findBones();setInitialPose();},900);
        ctx.onLoaded?.(woman);
      },
      err=>console.error("receptionist.glb load error",err)
    );
  };

  const applyApprovedPose=(talking)=>{
    if(!casinoWoman || !look.ready) return;
    const now=performance.now();
    const t=now*.001;
    if(poseState.baseYaw===null){
      poseState.baseYaw=casinoWoman.rotation.y;
    }
    if(talking && !poseState.wasTalking){
      poseState.talkStart=now;
      poseState.postTalkLatched=true;
    }
    poseState.wasTalking=talking;
    const target=
      (talking || poseState.postTalkLatched)
        ? mirroredPose()
        : approvedPose;

    poseBone(look.leftArm,target.leftArm,talking?.055:.045);
    poseBone(look.leftForeArm,target.leftForeArm,talking?.055:.045);
    poseBone(look.leftHand,target.leftHand,talking?.06:.045);
    poseBone(look.rightArm,target.rightArm,talking?.055:.045);
    poseBone(look.rightForeArm,target.rightForeArm,talking?.055:.045);
    poseBone(look.rightHand,target.rightHand,talking?.06:.045);

    const bodyAmp=
      (talking || poseState.postTalkLatched)?.010:.004;
    const headAmp=
      (talking || poseState.postTalkLatched)?.045:.012;

    if(look.spine2){
      const r=poseRest(look.spine2);
      look.spine2.rotation.z=THREE.MathUtils.lerp(
        look.spine2.rotation.z,
        r.z+Math.sin(t*.85)*bodyAmp,
        .035
      );
    }
    if(look.neck){
      const r=poseRest(look.neck);
      look.neck.rotation.y=THREE.MathUtils.lerp(
        look.neck.rotation.y,
        r.y+Math.sin(t*.72)*headAmp*.45,
        .04
      );
    }
    if(look.head){
      const r=poseRest(look.head);
      look.head.rotation.y=THREE.MathUtils.lerp(
        look.head.rotation.y,
        r.y+Math.sin(t*.72+.35)*headAmp,
        .045
      );
      look.head.rotation.x=THREE.MathUtils.lerp(
        look.head.rotation.x,
        r.x+Math.sin(t*.48)*headAmp*.22,
        .04
      );
    }

    if(talking && ctx.player?.root){
      const wp=new THREE.Vector3();
      const pp=new THREE.Vector3();
      casinoWoman.getWorldPosition(wp);
      ctx.player.root.getWorldPosition(pp);
      const desired=
        Math.atan2(pp.x-wp.x,pp.z-wp.z)+
        poseState.manualYawOffset;

      casinoWoman.rotation.y=
        ctx.lerpAngle(
          casinoWoman.rotation.y,
          desired,
          .035
        );

      const local=casinoWoman.worldToLocal(pp.clone());
      const yaw=THREE.MathUtils.clamp(
        Math.atan2(local.x,local.z),
        -.42,
        .42
      );

      if(look.neck){
        const r=poseRest(look.neck);
        look.neck.rotation.y=THREE.MathUtils.lerp(
          look.neck.rotation.y,
          r.y+yaw*.22+Math.sin(t*.72)*headAmp*.35,
          .05
        );
      }
      if(look.head){
        const r=poseRest(look.head);
        look.head.rotation.y=THREE.MathUtils.lerp(
          look.head.rotation.y,
          r.y+yaw*.50+Math.sin(t*.72+.35)*headAmp,
          .055
        );
      }
    }else if(!poseState.postTalkLatched){
      casinoWoman.rotation.y=
        ctx.lerpAngle(
          casinoWoman.rotation.y,
          poseState.baseYaw+poseState.manualYawOffset,
          .012
        );
    }
  };

  const update=()=>{
    if(
      !casinoWoman ||
      !ctx.player?.root ||
      ctx.activeWorldZone!=="leftRoom"
    ) return;

    if(!look.ready) findBones();
    if(!look.head) return;

    const talking=
      ctx.QUEST.dialogueActive &&
      ctx.QUEST.dialogueSpeaker==="RECEPTIONIST";

    applyApprovedPose(talking);
  };

  return {
    load,
    update,
    getRoot:()=>casinoWoman
  };
}
