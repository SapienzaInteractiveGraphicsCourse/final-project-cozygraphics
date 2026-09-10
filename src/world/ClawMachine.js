export function createClawMachine(ctx){
  const THREE=ctx.THREE;
  const C={
    baseX:-7.8,
    baseZ:-22.9,
    root:new THREE.Group(),
    cabinet:null,
    system:new THREE.Group(),
    toys:[],
    fingers:[],
    topY:3.95,
    idleY:3.35,
    downY:2.78,
    state:{
      x:0,z:0,y:3.35,
      phase:"idle",
      timer:0,
      holding:null,
      falling:null,
      fallSpeed:0,
      grabOffset:null,
      grabQ:null,
      releaseHeight:null,
      fallSpinX:0,
      fallSpinZ:0,
      headSquash:1,
      headSquashFrames:0,
      grabStart:null,
      grabTarget:null,
      gripStrength:0,
      releaseFrame:null
    },
    prompt:null
  };

  C.root.name="casino_claw_machine_complete";
  C.root.position.set(-8.200,0.100,-7.600);
  C.root.rotation.set(
    0,
    THREE.MathUtils.degToRad(-90),
    0
  );
  C.root.scale.set(1.2442,1.2442,1.2442);
  ctx.scene.add(C.root);
  C.root.add(C.system);
  ctx.registerCasinoEditable?.("clawMachine",C.root);

  const mat=color=>
    new THREE.MeshStandardMaterial({
      color,
      roughness:.55,
      metalness:0
    });

  const addEye=(parent,x,y,z)=>{
    const white=new THREE.Mesh(
      new THREE.SphereGeometry(.035,16,16),
      mat(0xffffff)
    );
    white.scale.set(1,.8,.35);
    white.position.set(x,y,z);
    const pupil=new THREE.Mesh(
      new THREE.SphereGeometry(.014,12,12),
      mat(0x111111)
    );
    pupil.position.set(x,y,z+.025);
    parent.add(white,pupil);
  };

  const addFoot=(parent,x,z,color)=>{
    const foot=new THREE.Mesh(
      new THREE.SphereGeometry(.075,16,16),
      mat(color)
    );
    foot.scale.set(1.50,1.02,1.03);
    foot.position.set(x,.215,z);
    parent.add(foot);
  };

  const addArm=(parent,x,color)=>{
    const arm=new THREE.Mesh(
      new THREE.CapsuleGeometry(.035,.22,8,14),
      mat(color)
    );
    arm.position.set(x,.40,.03);
    arm.rotation.z=x>0?-.65:.65;
    parent.add(arm);
  };

  const addBow=(parent,color=0xff3366)=>{
    const bow1=new THREE.Mesh(
      new THREE.SphereGeometry(.045,12,12),
      mat(color)
    );
    bow1.scale.set(1.4,.7,.5);
    bow1.position.set(-.04,.43,.15);
    const bow2=bow1.clone();
    bow2.position.x=.04;
    const knot=new THREE.Mesh(
      new THREE.SphereGeometry(.025,8,8),
      mat(0xaa0033)
    );
    knot.position.set(0,.43,.17);
    parent.add(bow1,bow2,knot);
  };

  const finishToy=(p,ox,y,oz,rx=0,ry=0,rz=0)=>{
    p.position.set(ox,y,oz);
    p.rotation.set(rx,ry,rz);
    p.userData.restY=y;
    p.userData.restQ=p.quaternion.clone();
    if(!p.userData.headGrip){
      p.userData.headGrip={x:0,y:.62,z:0};
    }
    C.root.add(p);
    C.toys.push(p);
  };

  const teddy=(ox,y,oz,color,rx=0,ry=0,rz=0)=>{
    const p=new THREE.Group();
    p.userData.headGrip={x:0,y:.72,z:0};
    p.userData.headRadius=.17;
    const body=new THREE.Mesh(
      new THREE.SphereGeometry(.23,28,28),
      mat(color)
    );
    body.scale.set(1.03,1.10,.90);
    body.position.y=.375;
    const belly=new THREE.Mesh(
      new THREE.SphereGeometry(.12,18,18),
      mat(0xffddbb)
    );
    belly.scale.set(1,.75,.35);
    belly.position.set(0,.39,.16);
    const head=new THREE.Mesh(
      new THREE.SphereGeometry(.17,28,28),
      mat(color)
    );
    head.position.y=.72;
    const ear1=new THREE.Mesh(
      new THREE.SphereGeometry(.065,18,18),
      mat(color)
    );
    ear1.position.set(-.13,.85,0);
    const ear2=ear1.clone();
    ear2.position.x=.13;
    const snout=new THREE.Mesh(
      new THREE.SphereGeometry(.065,16,16),
      mat(0xffddbb)
    );
    snout.scale.set(1.15,.75,.8);
    snout.position.set(0,.68,.15);
    addEye(p,-.055,.76,.14);
    addEye(p,.055,.76,.14);
    addFoot(p,-.092,.082,color);
    addFoot(p,.092,.082,color);
    addArm(p,-.20,color);
    addArm(p,.20,color);
    addBow(p,0x8844ff);
    p.add(body,belly,head,ear1,ear2,snout);
    p.userData.earOffset=new THREE.Vector3(0,.86,0);
    finishToy(p,ox,y,oz,rx,ry,rz);
  };

  const cat=(ox,y,oz,color,rx=0,ry=0,rz=0)=>{
    const p=new THREE.Group();
    p.userData.headGrip={x:0,y:.68,z:0};
    p.userData.headRadius=.17;
    const body=new THREE.Mesh(
      new THREE.SphereGeometry(.21,28,28),
      mat(color)
    );
    body.scale.set(1,.95,.8);
    body.position.y=.40;
    const head=new THREE.Mesh(
      new THREE.SphereGeometry(.17,28,28),
      mat(color)
    );
    head.position.y=.72;
    const earGeo=new THREE.ConeGeometry(.07,.16,3);
    const ear1=new THREE.Mesh(earGeo,mat(color));
    ear1.position.set(-.10,.91,0);
    ear1.rotation.z=.25;
    const ear2=new THREE.Mesh(earGeo,mat(color));
    ear2.position.set(.10,.91,0);
    ear2.rotation.z=-.25;
    addEye(p,-.055,.76,.14);
    addEye(p,.055,.76,.14);
    addFoot(p,-.11,.09,color);
    addFoot(p,.11,.09,color);
    addArm(p,-.19,color);
    addArm(p,.19,color);
    p.add(body,head,ear1,ear2);
    p.userData.earOffset=new THREE.Vector3(0,.93,0);
    finishToy(p,ox,y,oz,rx,ry,rz);
  };

  const bunny=(ox,y,oz,color,rx=0,ry=0,rz=0)=>{
    const p=new THREE.Group();
    p.userData.headGrip={x:0,y:.74,z:0};
    p.userData.headRadius=.19;
    const body=new THREE.Mesh(
      new THREE.SphereGeometry(.25,28,28),
      mat(color)
    );
    body.scale.set(1,.95,.9);
    body.position.y=.40;
    const earGeo=new THREE.CapsuleGeometry(.045,.40,10,18);
    const ear1=new THREE.Mesh(earGeo,mat(color));
    ear1.position.set(-.10,.86,0);
    ear1.rotation.z=.18;
    const ear2=new THREE.Mesh(earGeo,mat(color));
    ear2.position.set(.10,.86,0);
    ear2.rotation.z=-.18;
    addEye(p,-.07,.52,.20);
    addEye(p,.07,.52,.20);
    addFoot(p,-.11,.13,color);
    addFoot(p,.11,.13,color);
    addBow(p,0xff77aa);
    p.add(body,ear1,ear2);
    p.userData.earOffset=new THREE.Vector3(0,.92,0);
    finishToy(p,ox,y,oz,rx,ry,rz);
  };

  const tomato=(ox,y,oz,rx=0,ry=0,rz=0)=>{
    const p=new THREE.Group();
    p.userData.headGrip={x:0,y:.58,z:0};
    p.userData.headRadius=.20;
    const body=new THREE.Mesh(
      new THREE.SphereGeometry(.25,28,28),
      mat(0xff3333)
    );
    body.scale.set(1,1,.9);
    body.position.y=.40;
    const leaf=new THREE.Mesh(
      new THREE.ConeGeometry(.14,.13,7),
      mat(0x22aa33)
    );
    leaf.position.y=.70;
    leaf.rotation.x=Math.PI;
    addEye(p,-.07,.50,.21);
    addEye(p,.07,.50,.21);
    addFoot(p,-.11,.11,0x22aa33);
    addFoot(p,.11,.11,0x22aa33);
    addArm(p,-.20,0x22aa33);
    addArm(p,.20,0x22aa33);
    p.add(body,leaf);
    p.userData.earOffset=new THREE.Vector3(0,.72,0);
    finishToy(p,ox,y,oz,rx,ry,rz);
  };

  ctx.loadGLBFromCandidates(
    ["./assets/models/claw_cabinet.glb"],
    (gltf)=>{
      const cabinet=gltf.scene;
      ctx.cloneMaterials?.(cabinet);
      cabinet.updateMatrixWorld(true);
      const rawBox=new THREE.Box3().setFromObject(cabinet);
      const rawSize=rawBox.getSize(new THREE.Vector3());
      if(rawSize.y>.001){
        cabinet.scale.setScalar(4.6/rawSize.y);
      }
      cabinet.updateMatrixWorld(true);
      const box2=new THREE.Box3().setFromObject(cabinet);
      const center2=box2.getCenter(new THREE.Vector3());
      cabinet.position.x-=center2.x;
      cabinet.position.z-=center2.z;
      cabinet.position.y-=box2.min.y;
      cabinet.traverse(obj=>{
        if(!obj.isMesh) return;
        const n=(obj.name||"").toLowerCase();
        if(
          n.includes("pcylinder57") ||
          n.includes("polysurface42")
        ) obj.visible=false;
      });
      C.root.add(cabinet);
      C.cabinet=cabinet;
    },
    err=>console.error("claw_cabinet.glb load error",err)
  );

  const rod=new THREE.Mesh(
    new THREE.CylinderGeometry(.025,.025,1,16),
    new THREE.MeshStandardMaterial({
      color:0xe0e0e0,
      metalness:.8,
      roughness:.25
    })
  );
  C.rod=rod;
  C.system.add(rod);

  const grabber=new THREE.Group();
  C.grabber=grabber;
  C.system.add(grabber);

  const head=new THREE.Mesh(
    new THREE.SphereGeometry(.095,16,16),
    new THREE.MeshStandardMaterial({
      color:0x777777,
      metalness:.7,
      roughness:.25
    })
  );
  grabber.add(head);

  const finger=(angle)=>{
    const root=new THREE.Group();
    root.rotation.y=angle;
    grabber.add(root);

    const curve=new THREE.CatmullRomCurve3([
      new THREE.Vector3(0,0,0),
      new THREE.Vector3(.12,-.12,0),
      new THREE.Vector3(.19,-.24,0),
      new THREE.Vector3(.145,-.35,0),
      new THREE.Vector3(.085,-.39,0)
    ]);

    const geo=new THREE.TubeGeometry(
      curve,
      20,.018,8,false
    );

    root.add(
      new THREE.Mesh(
        geo,
        new THREE.MeshStandardMaterial({
          color:0xbfbfbf,
          metalness:.7,
          roughness:.28
        })
      )
    );

    C.fingers.push(root);
  };

  finger(0);
  finger(Math.PI*2/3);
  finger(Math.PI*4/3);
  teddy(-.22,1.64,-.26,0x352116,.12,0);
  cat(.20,1.64,-.24,0,-.10,0);
  tomato(.20,1.63,.18,0,-.08,0);
  teddy(.15,1.58,.25,0x6b4328,0,.2,.28);
  bunny(-.18,1.64,.18,0,.08,0);
  cat(-.35,1.45,-.45,0xffaa66,Math.PI/2.6,-.4,-.2);

  return C;
}

function getToyHeadWorldLocal(toy){
  const grip=toy.userData.headGrip || {x:0,y:.62,z:0};
  return {
    x:toy.position.x+grip.x,
    y:toy.position.y+grip.y,
    z:toy.position.z+grip.z
  };
}

function getClawGripCenter(C){
  return {
    x:C.system.position.x,
    y:C.state.y-.365,
    z:C.system.position.z
  };
}

function findNearestToy(C){
  let nearest=null;
  let best=Infinity;
  const center=getClawGripCenter(C);

  for(const toy of C.toys){
    if(toy===C.state.falling) continue;

    const head=getToyHeadWorldLocal(toy);
    const horizontal=Math.hypot(
      head.x-center.x,
      head.z-center.z
    );
    const vertical=Math.abs(head.y-center.y);

    const score=horizontal+vertical*.35;

    if(score<best){
      best=score;
      nearest=toy;
    }
  }

  if(!nearest) return null;

  const head=getToyHeadWorldLocal(nearest);
  const radius=nearest.userData.headRadius || .18;
  const horizontal=Math.hypot(
    head.x-center.x,
    head.z-center.z
  );
  const vertical=Math.abs(head.y-center.y);

  return (
    horizontal<=radius+.075 &&
    vertical<=.15
  ) ? nearest : null;
}

function prepareToyHeadGrab(C,toy){
  const st=C.state;

  st.grabStart=null;
  st.grabTarget=null;
  st.grabQ=null;
  st.gripStrength=0;
  st.releaseFrame=null;

  if(!toy) return;

  const grip=toy.userData.headGrip || {x:0,y:.62,z:0};
  const center=getClawGripCenter(C);

  st.grabStart={
    x:toy.position.x,
    y:toy.position.y,
    z:toy.position.z
  };

  st.grabTarget={
    x:center.x-grip.x,
    y:center.y-grip.y,
    z:center.z-grip.z
  };

  st.grabQ=toy.quaternion.clone();

  const r=Math.random();

  // Every successful grip will eventually release, but not on a fixed beat.
  // Some release during lift, some survive long enough for arrow movement.
  if(r<.22){
    st.releaseFrame=34+Math.floor(Math.random()*18);
  }else if(r<.68){
    st.releaseFrame=58+Math.floor(Math.random()*36);
  }else{
    st.releaseFrame=105+Math.floor(Math.random()*55);
  }

  st.headSquash=Math.random()<4/6
    ? .90+Math.random()*.045
    : 1;

  st.headSquashFrames=0;
}

function updateHeldToyGrip(C){
  const st=C.state;
  const toy=st.holding;
  if(!toy) return;

  const grip=toy.userData.headGrip || {x:0,y:.62,z:0};
  const center=getClawGripCenter(C);

  // During closure the plush settles gently into the exact middle of the
  // three prongs. After that the head remains locked to the grip center.
  if(st.phase==="grab"){
    st.gripStrength=Math.min(1,st.gripStrength+.115);
  }else{
    st.gripStrength=1;
  }

  const targetX=center.x-grip.x;
  const targetY=center.y-grip.y;
  const targetZ=center.z-grip.z;

  if(st.phase==="grab" && st.grabStart){
    const t=st.gripStrength*st.gripStrength*(3-2*st.gripStrength);

    toy.position.set(
      st.grabStart.x+(targetX-st.grabStart.x)*t,
      st.grabStart.y+(targetY-st.grabStart.y)*t,
      st.grabStart.z+(targetZ-st.grabStart.z)*t
    );
  }else{
    toy.position.set(targetX,targetY,targetZ);
  }

  if(st.grabQ){
    toy.quaternion.copy(st.grabQ);
  }

  // Visual compression is small and centered on the complete plush;
  // it does not alter the grip point or cause drift.
  const squashTarget=st.headSquash;
  const squash=1-(1-squashTarget)*st.gripStrength;
  toy.scale.set(1,squash,1);
}

function releaseHeldToy(C){
  const st=C.state;
  if(!st.holding) return;

  st.holding.scale.set(1,1,1);
  st.falling=st.holding;
  st.holding=null;
  st.fallSpeed=.009+Math.random()*.012;
  st.fallSpinX=(Math.random()-.5)*.014;
  st.fallSpinZ=(Math.random()-.5)*.018;
  st.grabStart=null;
  st.grabTarget=null;
  st.grabQ=null;
  st.gripStrength=0;
  st.releaseFrame=null;
  st.headSquash=1;
  st.headSquashFrames=0;
}

export function updateClawMachine(THREE,C){
  const st=C.state;

  C.system.position.x=st.x;
  C.system.position.z=st.z;

  if(st.phase==="idle"){
    st.y=C.idleY;
  }

  if(st.phase==="down"){
    st.y-=.025;

    if(st.y<=C.downY){
      st.y=C.downY;
      st.phase="grab";
      st.timer=0;
      st.holding=findNearestToy(C);
      prepareToyHeadGrab(C,st.holding);
    }
  }

  if(st.phase==="grab"){
    st.timer++;
    st.headSquashFrames++;

    updateHeldToyGrip(C);

    // Give the three prongs enough time to visibly close around the full head.
    if(st.timer>30){
      st.phase="up";
      st.timer=0;
    }
  }

  if(st.phase==="up"){
    st.timer++;
    st.y+=.022;

    updateHeldToyGrip(C);

    if(
      st.holding &&
      Number.isFinite(st.releaseFrame) &&
      st.timer>=st.releaseFrame
    ){
      releaseHeldToy(C);
    }

    if(st.y>=C.idleY){
      st.y=C.idleY;

      if(st.holding){
        // A surviving toy can remain held for a short top phase so the
        // player can move the claw with the arrows before it drops.
        st.phase="carry";
        st.timer=0;
      }else{
        st.phase="drop";
        st.timer=0;
      }
    }
  }

  if(st.phase==="carry"){
    st.timer++;
    updateHeldToyGrip(C);

    if(
      st.holding &&
      Number.isFinite(st.releaseFrame) &&
      st.timer>=Math.max(28,st.releaseFrame-88)
    ){
      releaseHeldToy(C);
      st.phase="drop";
      st.timer=0;
    }
  }

  if(st.phase==="drop"){
    st.timer++;

    if(st.timer>34){
      st.phase="idle";
    }
  }

  if(st.falling){
    st.falling.position.y-=st.fallSpeed;
    st.fallSpeed+=.0028;
    st.falling.rotation.x+=st.fallSpinX;
    st.falling.rotation.z+=st.fallSpinZ;

    const floorY=1.45;

    if(st.falling.position.y<=floorY){
      st.falling.position.y=floorY;
      st.falling.rotation.x*=.22;
      st.falling.rotation.z*=.22;
      st.falling.scale.set(1,1,1);
      st.falling=null;
      st.fallSpeed=0;
      st.fallSpinX=0;
      st.fallSpinZ=0;
    }
  }

  const rodLength=C.topY-st.y;
  C.rod.scale.y=rodLength;
  C.rod.position.y=st.y+rodLength/2;
  C.grabber.position.y=st.y;

  const closed=
    st.phase==="grab" ||
    st.phase==="up" ||
    st.phase==="carry";

  // Three-prong grip: wide enough to enter around the head, then closes
  // symmetrically. There is no one-sided pinch.
  const closeT=closed
    ? Math.min(1,st.gripStrength||1)
    : 0;

  const openAngle=.46;
  const closedAngle=.16;
  const angle=openAngle+(closedAngle-openAngle)*closeT;

  for(const finger of C.fingers){
    finger.rotation.z=angle;
  }
}
