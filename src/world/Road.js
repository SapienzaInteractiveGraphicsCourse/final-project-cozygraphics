import * as THREE from "three";
import {ROAD_CONFIG} from "../config/road.config.js";

export let crosswalkOffsets=[];

let ROAD_RUNTIME=null;

const GARDEN_CURVED_SIDEWALK_EDITOR={
  extension:.20,
  step:.05,
  mesh:null
};

function requireRuntime(){
  if(!ROAD_RUNTIME){
    throw new Error("Road runtime non inizializzato. Chiama initRoadCore() prima.");
  }
  return ROAD_RUNTIME;
}

export function applyWorldPlanarUV(geometry,tileSize=5){
  const pos=geometry.attributes.position;
  const uv=[];

  for(let i=0;i<pos.count;i++){
    uv.push(
      pos.getX(i)/tileSize,
      pos.getZ(i)/tileSize
    );
  }

  geometry.setAttribute(
    "uv",
    new THREE.Float32BufferAttribute(uv,2)
  );

  return geometry;
}

export function makeStripAlongCurve(
  name,
  curve,
  offsetA,
  offsetB,
  y,
  material,
  segments=320,
  tileSize=5
){
  const {scene}=requireRuntime();

  const positions=[];
  const uvs=[];
  const indices=[];

  for(let i=0;i<=segments;i++){
    const t=i/segments;
    const p=curve.getPoint(t);
    const tangent=curve.getTangent(t).normalize();

    const nx=-tangent.z;
    const nz=tangent.x;

    const ax=p.x+nx*offsetA;
    const az=p.z+nz*offsetA;
    const bx=p.x+nx*offsetB;
    const bz=p.z+nz*offsetB;

    positions.push(
      ax,y,az,
      bx,y,bz
    );

    uvs.push(
      ax/tileSize,az/tileSize,
      bx/tileSize,bz/tileSize
    );

    if(i<segments){
      const a=i*2;
      const b=a+1;
      const c=a+2;
      const d=a+3;

      indices.push(
        a,c,b,
        c,d,b
      );
    }
  }

  const geometry=new THREE.BufferGeometry();

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions,3)
  );

  geometry.setAttribute(
    "uv",
    new THREE.Float32BufferAttribute(uvs,2)
  );

  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const mesh=new THREE.Mesh(
    geometry,
    material
  );

  mesh.name=name;
  mesh.receiveShadow=true;

  scene.add(mesh);

  return mesh;
}

export function makeFlatCurveBorder(
  name,
  curve,
  offset,
  y,
  width,
  material,
  segments=640
){
  return makeStripAlongCurve(
    name,
    curve,
    offset-width*.5,
    offset+width*.5,
    y,
    material,
    segments,
    ROAD_CONFIG.lane.tileSize
  );
}

function createURoadCurve(){
  const cfg=ROAD_CONFIG.uShape;

  const U_X=cfg.x;
  const U_FRONT_Z=cfg.frontZ;
  const U_BACK_Z=cfg.backZ;
  const U_RADIUS=cfg.radius;
  const U_ARC_K=cfg.arcK;

  const curve=new THREE.CurvePath();

  curve.add(
    new THREE.LineCurve3(
      new THREE.Vector3(-U_X,0,U_BACK_Z),
      new THREE.Vector3(
        -U_X,
        0,
        U_FRONT_Z-U_RADIUS
      )
    )
  );

  curve.add(
    new THREE.CubicBezierCurve3(
      new THREE.Vector3(
        -U_X,
        0,
        U_FRONT_Z-U_RADIUS
      ),
      new THREE.Vector3(
        -U_X,
        0,
        U_FRONT_Z-U_RADIUS+U_RADIUS*U_ARC_K
      ),
      new THREE.Vector3(
        -U_X+U_RADIUS-U_RADIUS*U_ARC_K,
        0,
        U_FRONT_Z
      ),
      new THREE.Vector3(
        -U_X+U_RADIUS,
        0,
        U_FRONT_Z
      )
    )
  );

  curve.add(
    new THREE.LineCurve3(
      new THREE.Vector3(
        -U_X+U_RADIUS,
        0,
        U_FRONT_Z
      ),
      new THREE.Vector3(
        U_X-U_RADIUS,
        0,
        U_FRONT_Z
      )
    )
  );

  curve.add(
    new THREE.CubicBezierCurve3(
      new THREE.Vector3(
        U_X-U_RADIUS,
        0,
        U_FRONT_Z
      ),
      new THREE.Vector3(
        U_X-U_RADIUS+U_RADIUS*U_ARC_K,
        0,
        U_FRONT_Z
      ),
      new THREE.Vector3(
        U_X,
        0,
        U_FRONT_Z-U_RADIUS+U_RADIUS*U_ARC_K
      ),
      new THREE.Vector3(
        U_X,
        0,
        U_FRONT_Z-U_RADIUS
      )
    )
  );

  curve.add(
    new THREE.LineCurve3(
      new THREE.Vector3(
        U_X,
        0,
        U_FRONT_Z-U_RADIUS
      ),
      new THREE.Vector3(
        U_X,
        0,
        U_BACK_Z
      )
    )
  );

  return curve;
}

function buildSidewalkJoinFix(){
  const {SIDEWALK_JOIN_FIX}=requireRuntime();
  SIDEWALK_JOIN_FIX.clear();
}


function rebuildGardenCurvedSidewalkExtension(){
  const runtime=requireRuntime();
  const {scene,uRoadCurve,unifiedSidewalkMat}=runtime;
  const sidewalk=ROAD_CONFIG.sidewalk;

  const previous=
    scene.getObjectByName(
      "u_garden_sidewalk_concrete_continuous"
    );

  if(previous){
    previous.parent?.remove(previous);
    previous.geometry?.dispose?.();
  }

  const extension=Math.max(
    0,
    Number(GARDEN_CURVED_SIDEWALK_EDITOR.extension)||0
  );

  // REAL large curved sidewalk:
  // road-facing edge fixed, Garden-facing edge expands.
  const mesh=makeStripAlongCurve(
    "u_garden_sidewalk_concrete_continuous",
    uRoadCurve,
    sidewalk.gardenInnerOffset,
    sidewalk.gardenOuterOffset+extension,
    sidewalk.gardenY,
    unifiedSidewalkMat,
    sidewalk.segments,
    sidewalk.tileSize
  );

  mesh.castShadow=false;
  mesh.receiveShadow=true;
  mesh.renderOrder=10;
  mesh.userData.gardenSidewalkExtension=extension;

  GARDEN_CURVED_SIDEWALK_EDITOR.mesh=mesh;
  refreshGardenCurvedSidewalkEditor();
  return mesh;
}

function refreshGardenCurvedSidewalkEditor(){
  if(typeof document==="undefined") return;

  const read=document.getElementById(
    "gardenCurvedSidewalkRead"
  );

  if(read){
    read.textContent=
      `CURVED SIDEWALK CONTROL — ROAD\n`+
      `EXTEND ${GARDEN_CURVED_SIDEWALK_EDITOR.extension.toFixed(2)} m\n`+
      `STEP ${GARDEN_CURVED_SIDEWALK_EDITOR.step.toFixed(2)} m\n`+
      `DIRECTION TOWARD GARDEN / BARRICADES`;
  }

  const stepInput=document.getElementById(
    "gardenCurvedSidewalkStep"
  );

  if(
    stepInput &&
    document.activeElement!==stepInput
  ){
    stepInput.value=
      GARDEN_CURVED_SIDEWALK_EDITOR.step.toFixed(2);
  }
}

function initGardenCurvedSidewalkEditor(){
  if(
    typeof document==="undefined" ||
    document.getElementById("gardenCurvedSidewalkToggle")
  ){
    return;
  }

  const toggle=document.createElement("button");
  toggle.id="gardenCurvedSidewalkToggle";
  toggle.textContent="CURVED SIDEWALK CONTROL";

  Object.assign(toggle.style,{
    position:"fixed",
    left:"50%",
    top:"18px",
    transform:"translateX(-50%)",
    zIndex:"2147483000",
    padding:"8px 11px",
    border:"1px solid rgba(160,190,220,.65)",
    borderRadius:"8px",
    background:"rgba(55,82,105,.99)",
    color:"#fff",
    font:"900 9px Arial,sans-serif",
    letterSpacing:".10em",
    cursor:"pointer"
  });

  const panel=document.createElement("div");
  panel.id="gardenCurvedSidewalkPanel";

  Object.assign(panel.style,{
    position:"fixed",
    left:"50%",
    top:"60px",
    transform:"translateX(-50%)",
    zIndex:"2147483001",
    width:"310px",
    display:"none",
    padding:"12px",
    border:"1px solid rgba(160,190,220,.48)",
    borderRadius:"10px",
    background:"rgba(16,22,28,.98)",
    color:"#fff",
    font:"11px Arial,sans-serif"
  });

  panel.innerHTML=`
    <div style="font-weight:900;letter-spacing:.09em;margin-bottom:8px">
      CURVED SIDEWALK CONTROL — ROAD
    </div>

    <pre id="gardenCurvedSidewalkRead"
      style="white-space:pre-wrap;background:rgba(255,255,255,.05);padding:7px;border-radius:6px"></pre>

    <div style="display:grid;grid-template-columns:80px 1fr;gap:6px;align-items:center;margin:8px 0">
      <b>STEP</b>
      <input id="gardenCurvedSidewalkStep"
        type="number"
        min=".01"
        max="2"
        step=".01"
        value=".05"
        style="width:100%;box-sizing:border-box">
    </div>

    <div style="display:grid;grid-template-columns:80px 1fr 1fr;gap:6px;align-items:center;margin:8px 0">
      <b>EXTEND</b>
      <button data-garden-curved-sidewalk="-1">−</button>
      <button data-garden-curved-sidewalk="1">+</button>
    </div>

    <div style="font-size:10px;opacity:.72;margin-top:5px">
      Controlla SOLO il marciapiede grande curvo davanti al Garden.
      La piccola strip d'ingresso è fissa e non ha più nessun pannello.
    </div>

    <button id="gardenCurvedSidewalkReset"
      style="width:100%;margin-top:9px;padding:7px;font-weight:900">
      RESET 20 CM
    </button>
  `;

  document.body.append(toggle,panel);

  toggle.addEventListener("click",()=>{
    panel.style.display=
      panel.style.display==="block"
        ?"none"
        :"block";
    refreshGardenCurvedSidewalkEditor();
  });

  panel.addEventListener(
    "pointerdown",
    event=>event.stopPropagation()
  );

  panel.addEventListener(
    "click",
    event=>event.stopPropagation()
  );

  document.getElementById("gardenCurvedSidewalkStep")
    ?.addEventListener("change",event=>{
      const value=Math.abs(
        Number(event.target.value)
      );

      GARDEN_CURVED_SIDEWALK_EDITOR.step=
        THREE.MathUtils.clamp(
          Number.isFinite(value)
            ? value
            : .05,
          .01,
          2
        );

      refreshGardenCurvedSidewalkEditor();
    });

  panel.querySelectorAll(
    "[data-garden-curved-sidewalk]"
  ).forEach(button=>{
    button.addEventListener("click",()=>{
      const direction=
        Number(
          button.dataset.gardenCurvedSidewalk||0
        );

      GARDEN_CURVED_SIDEWALK_EDITOR.extension=
        THREE.MathUtils.clamp(
          GARDEN_CURVED_SIDEWALK_EDITOR.extension+
          direction*
          GARDEN_CURVED_SIDEWALK_EDITOR.step,
          0,
          10
        );

      rebuildGardenCurvedSidewalkExtension();
    });
  });

  document.getElementById(
    "gardenCurvedSidewalkReset"
  )?.addEventListener("click",()=>{
    GARDEN_CURVED_SIDEWALK_EDITOR.extension=.20;
    rebuildGardenCurvedSidewalkExtension();
  });

  refreshGardenCurvedSidewalkEditor();
}

export function getGardenCurvedSidewalkExtension(){
  return GARDEN_CURVED_SIDEWALK_EDITOR.extension;
}

export function setGardenCurvedSidewalkExtension(value){
  GARDEN_CURVED_SIDEWALK_EDITOR.extension=
    THREE.MathUtils.clamp(
      Number(value)||0,
      0,
      10
    );

  return rebuildGardenCurvedSidewalkExtension();
}

export function initRoadCore({
  scene,
  makeTiledTexture,
  unifiedSidewalkMat
}){
  if(!scene){
    throw new Error("initRoadCore: scene mancante.");
  }

  if(typeof makeTiledTexture!=="function"){
    throw new Error("initRoadCore: makeTiledTexture mancante.");
  }

  if(!unifiedSidewalkMat){
    throw new Error("initRoadCore: unifiedSidewalkMat mancante.");
  }

  const roadGreyMat=
    new THREE.MeshStandardMaterial({
      map:makeTiledTexture(
        ROAD_CONFIG.textures.asphalt,
        1,
        1
      ),
      roughness:.95,
      metalness:0,
      side:THREE.DoubleSide
    });

  const curbMat=
    new THREE.MeshStandardMaterial({
      color:ROAD_CONFIG.curb.color,
      roughness:ROAD_CONFIG.curb.roughness,
      side:THREE.DoubleSide
    });

  const roadMarkingMat=
    new THREE.MeshStandardMaterial({
      color:ROAD_CONFIG.marking.color,
      roughness:ROAD_CONFIG.marking.roughness,
      metalness:0,
      side:THREE.DoubleSide
    });

  const uRoadCurve=createURoadCurve();

  const INFINITE_ROAD={
    group:new THREE.Group(),
    built:false,
    decorCars:[],
    warningUntil:0
  };

  INFINITE_ROAD.group.name=
    "infinite_road_optical";

  scene.add(INFINITE_ROAD.group);

  const SIDEWALK_JOIN_FIX=
    new THREE.Group();

  SIDEWALK_JOIN_FIX.name=
    "sidewalk_join_fix";

  scene.add(SIDEWALK_JOIN_FIX);

  const crossCfg=ROAD_CONFIG.crosswalk;

  const CROSSWALK={
    centerX:crossCfg.centerX,
    centerZ:ROAD_CONFIG.uShape.frontZ,

    stripeLength:crossCfg.stripeLength,
    stripeDepth:crossCfg.stripeDepth,
    stripeGap:crossCfg.stripeGap,
    totalDepth:crossCfg.totalDepth
  };

  CROSSWALK.halfWidth=
    CROSSWALK.stripeLength*.5;

  CROSSWALK.roadMinZ=
    ROAD_CONFIG.uShape.frontZ-
    ROAD_CONFIG.lane.halfWidth;

  CROSSWALK.roadMaxZ=
    ROAD_CONFIG.uShape.frontZ+
    ROAD_CONFIG.lane.halfWidth;

  ROAD_RUNTIME={
    scene,
    unifiedSidewalkMat,
    roadGreyMat,
    curbMat,
    roadMarkingMat,
    uRoadCurve,
    INFINITE_ROAD,
    SIDEWALK_JOIN_FIX,
    CROSSWALK
  };

  const lane=ROAD_CONFIG.lane;

  makeStripAlongCurve(
    "u_road_lane_shop_side_equal_width",
    uRoadCurve,
    -lane.halfWidth,
    0,
    lane.y,
    roadGreyMat,
    lane.segments,
    lane.tileSize
  );

  makeStripAlongCurve(
    "u_road_lane_garden_side_equal_width",
    uRoadCurve,
    0,
    lane.halfWidth,
    lane.y,
    roadGreyMat,
    lane.segments,
    lane.tileSize
  );

  const sidewalk=ROAD_CONFIG.sidewalk;

  makeStripAlongCurve(
    "u_shop_sidewalk_concrete_continuous_thick",
    uRoadCurve,
    sidewalk.shopInnerOffset,
    sidewalk.shopOuterOffset,
    sidewalk.shopY,
    unifiedSidewalkMat,
    sidewalk.segments,
    sidewalk.tileSize
  );

  rebuildGardenCurvedSidewalkExtension();
  initGardenCurvedSidewalkEditor();

  makeFlatCurveBorder(
    "u_road_shop_curb_clean",
    uRoadCurve,
    ROAD_CONFIG.curb.shopOffset,
    ROAD_CONFIG.curb.y,
    ROAD_CONFIG.curb.width,
    curbMat,
    ROAD_CONFIG.curb.segments
  );

  makeFlatCurveBorder(
    "u_road_garden_curb_clean",
    uRoadCurve,
    ROAD_CONFIG.curb.gardenOffset,
    ROAD_CONFIG.curb.y,
    ROAD_CONFIG.curb.width,
    curbMat,
    ROAD_CONFIG.curb.segments
  );

  buildSidewalkJoinFix();

  return {
    U_X:ROAD_CONFIG.uShape.x,
    U_FRONT_Z:ROAD_CONFIG.uShape.frontZ,
    U_BACK_Z:ROAD_CONFIG.uShape.backZ,
    U_RADIUS:ROAD_CONFIG.uShape.radius,
    U_ARC_K:ROAD_CONFIG.uShape.arcK,

    uRoadCurve,
    roadGreyMat,
    curbMat,
    roadMarkingMat,

    INFINITE_ROAD,
    SIDEWALK_JOIN_FIX,
    CROSSWALK
  };
}

function makeCurvedRoadDash(
  name,
  curve,
  tStart,
  tEnd,
  width=ROAD_CONFIG.marking.dashWidth,
  y=ROAD_CONFIG.marking.dashY,
  segments=ROAD_CONFIG.marking.dashSegments
){
  const {scene,roadMarkingMat}=requireRuntime();

  const positions=[];
  const uvs=[];
  const indices=[];

  for(let i=0;i<=segments;i++){
    const t=THREE.MathUtils.lerp(
      tStart,
      tEnd,
      i/segments
    );

    const p=curve.getPoint(t);
    const tangent=curve.getTangent(t).normalize();

    const nx=-tangent.z;
    const nz=tangent.x;

    positions.push(
      p.x+nx*width*.5,
      y,
      p.z+nz*width*.5,

      p.x-nx*width*.5,
      y,
      p.z-nz*width*.5
    );

    const u=i/segments;
    uvs.push(u,0,u,1);

    if(i<segments){
      const a=i*2;
      const b=a+1;
      const c=a+2;
      const d=a+3;

      indices.push(
        a,c,b,
        c,d,b
      );
    }
  }

  const geometry=new THREE.BufferGeometry();

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      positions,
      3
    )
  );

  geometry.setAttribute(
    "uv",
    new THREE.Float32BufferAttribute(
      uvs,
      2
    )
  );

  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const mesh=new THREE.Mesh(
    geometry,
    roadMarkingMat
  );

  mesh.name=name;
  mesh.receiveShadow=true;

  scene.add(mesh);

  return mesh;
}

function createEdgeWornCrosswalkMaterial(seed){
  const canvas=document.createElement("canvas");
  canvas.width=512;
  canvas.height=64;

  const ctx=canvas.getContext("2d");

  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  ctx.fillStyle="rgba(255,255,255,1)";

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  let state=
    (seed*9301+49297)%233280;

  const random=()=>{
    state=(state*9301+49297)%233280;
    return state/233280;
  };

  ctx.globalCompositeOperation=
    "destination-out";

  function irregularPatch(
    cx,
    cy,
    length,
    height,
    opacity,
    points=8
  ){
    ctx.beginPath();

    const halfL=length*.5;
    const halfH=height*.5;

    const top=[];
    const bottom=[];

    for(let i=0;i<=points;i++){
      const t=i/points;
      const x=cx-halfL+t*length;
      const wobble=
        (random()-.5)*height*.55;

      top.push([
        x,
        cy-halfH+wobble
      ]);
    }

    for(let i=points;i>=0;i--){
      const t=i/points;
      const x=cx-halfL+t*length;
      const wobble=
        (random()-.5)*height*.55;

      bottom.push([
        x,
        cy+halfH+wobble
      ]);
    }

    const pts=top.concat(bottom);

    ctx.moveTo(
      pts[0][0],
      pts[0][1]
    );

    for(let i=1;i<pts.length;i++){
      ctx.lineTo(
        pts[i][0],
        pts[i][1]
      );
    }

    ctx.closePath();

    ctx.fillStyle=
      `rgba(0,0,0,${opacity})`;

    ctx.fill();
  }

  for(let side=0;side<2;side++){
    for(let i=0;i<10;i++){
      const nearLeft=side===0;

      const x=nearLeft
        ? 4+random()*76
        : canvas.width-80+random()*76;

      const y=
        4+random()*(canvas.height-8);

      const length=
        12+random()*42;

      const height=
        1.5+random()*4.5;

      const opacity=
        .10+random()*.22;

      irregularPatch(
        x,
        y,
        length,
        height,
        opacity,
        7+Math.floor(random()*4)
      );
    }
  }

  for(let i=0;i<4;i++){
    const x=
      canvas.width*.30+
      random()*canvas.width*.40;

    const y=
      5+random()*(canvas.height-10);

    const length=
      10+random()*30;

    const height=
      1.2+random()*3.2;

    const opacity=
      .06+random()*.12;

    irregularPatch(
      x,
      y,
      length,
      height,
      opacity,
      7+Math.floor(random()*3)
    );
  }

  for(let i=0;i<8;i++){
    const edge=random()<.78;
    let x;

    if(edge){
      x=random()<.5
        ? random()*95
        : canvas.width-95+random()*95;
    }else{
      x=
        canvas.width*.34+
        random()*canvas.width*.32;
    }

    const y=random()*canvas.height;
    const length=9+random()*34;
    const height=.35+random()*.85;
    const opacity=.07+random()*.13;

    irregularPatch(
      x,
      y,
      length,
      height,
      opacity,
      6+Math.floor(random()*3)
    );
  }

  ctx.globalCompositeOperation=
    "source-over";

  const texture=
    new THREE.CanvasTexture(canvas);

  texture.colorSpace=
    THREE.SRGBColorSpace;

  texture.wrapS=
    THREE.ClampToEdgeWrapping;

  texture.wrapT=
    THREE.ClampToEdgeWrapping;

  texture.magFilter=
    THREE.LinearFilter;

  texture.minFilter=
    THREE.LinearMipmapLinearFilter;

  texture.needsUpdate=true;

  return new THREE.MeshStandardMaterial({
    color:0xffffff,
    map:texture,
    transparent:true,
    opacity:1,
    alphaTest:.018,
    depthWrite:true,
    roughness:.88,
    metalness:0
  });
}

export function buildRoadMarkings(){
  const {
    scene,
    uRoadCurve,
    CROSSWALK
  }=requireRuntime();

  const marking=ROAD_CONFIG.marking;

  for(let i=0;i<marking.dashCount;i++){
    const centerT=
      (i+.5)/marking.dashCount;

    const halfT=
      marking.dashLengthT*.5;

    const tStart=
      Math.max(0,centerT-halfT);

    const tEnd=
      Math.min(1,centerT+halfT);

    makeCurvedRoadDash(
      `u_road_center_dash_curved_${i}`,
      uRoadCurve,
      tStart,
      tEnd,
      marking.dashWidth,
      marking.dashY,
      marking.dashSegments
    );
  }

  const crossCfg=ROAD_CONFIG.crosswalk;

  const crosswalkStep=
    CROSSWALK.stripeDepth+
    CROSSWALK.stripeGap;

  const crosswalkHalfDepth=
    CROSSWALK.totalDepth*.5;

  const firstStripeOffset=
    CROSSWALK.stripeGap*.5+
    CROSSWALK.stripeDepth*.5;

  crosswalkOffsets.length=0;

  for(
    let offset=firstStripeOffset;
    offset+CROSSWALK.stripeDepth*.5<=
      crosswalkHalfDepth+.001;
    offset+=crosswalkStep
  ){
    crosswalkOffsets.push(
      -offset,
      offset
    );
  }

  crosswalkOffsets.sort(
    (a,b)=>a-b
  );

  crosswalkOffsets.forEach(
    (offset,crosswalkIndex)=>{
      const stripe=new THREE.Mesh(
        new THREE.BoxGeometry(
          CROSSWALK.stripeLength,
          .032,
          CROSSWALK.stripeDepth
        ),
        createEdgeWornCrosswalkMaterial(
          crosswalkIndex+
          crossCfg.wornSeedBase
        )
      );

      stripe.name=
        `crosswalk_stripe_${crosswalkIndex}`;

      stripe.position.set(
        CROSSWALK.centerX,
        crossCfg.y,
        CROSSWALK.centerZ+offset
      );

      stripe.receiveShadow=true;

      scene.add(stripe);
    }
  );
}

export function buildInfiniteRoadOptical(infiniteRoad){
  if(!infiniteRoad) return;
  infiniteRoad.built=true;
}

export function removeInfiniteRoadBlackBlockers(
  scene,
  lightCollision
){
  if(!scene) return;

  const doomed=[];

  scene.traverse(object=>{
    const name=
      String(object?.name||"")
        .toLowerCase();

    if(
      name.includes("infinite_road_limit")||
      name.includes("road_end_black")||
      name.includes("road_black_wall")||
      name.includes("infinite_black")||
      name.includes("road_void")||
      name.includes("black_road")
    ){
      doomed.push(object);
    }
  });

  for(const object of doomed){
    object.visible=false;
    object.parent?.remove(object);
  }

  if(lightCollision){
    lightCollision.static=
      lightCollision.static.filter(
        collider=>{
          const name=
            String(collider?.name||"")
              .toLowerCase();

          return !name.includes(
            "infinite_road_limit"
          );
        }
      );
  }
}

export function hideRoadsideGrassStrips(scene){
  if(!scene) return;

  scene.traverse(object=>{
    if(!object) return;

    const name=
      String(object.name||"")
        .toLowerCase();

    const isGrass=
      name.includes("grass")||
      name.includes("green_strip");

    if(isGrass&&object.scale){
      object.scale.multiplyScalar(
        ROAD_CONFIG.roadsideGrassScale
      );

      object.updateMatrixWorld?.(true);
    }

    const isRoadsideStrip=
      name.includes("strip")||
      name.includes("roadside")||
      name.includes("sidewalk_edge")||
      name.includes("extension");

    const isGarden=
      name.includes("garden");

    if(
      isGrass&&
      isRoadsideStrip&&
      !isGarden
    ){
      object.visible=false;
    }
  });
}


export function buildRoadExtensions(){
  const {
    scene,
    roadGreyMat,
    unifiedSidewalkMat,
    roadMarkingMat
  }=requireRuntime();

  const cfg=ROAD_CONFIG.extension;
  const u=ROAD_CONFIG.uShape;

  const group=new THREE.Group();
  group.name="road_extensions";

  function makeExtensionStrip(name,cx,width,y,material){
    const length=cfg.length+.40;
    const centerZ=u.backZ-length*.5+.20;

    const geometry=new THREE.PlaneGeometry(width,length);
    geometry.rotateX(-Math.PI/2);
    applyWorldPlanarUV(geometry,ROAD_CONFIG.lane.tileSize);

    const mesh=new THREE.Mesh(geometry,material);
    mesh.name=name;
    mesh.position.set(cx,y,centerZ);
    mesh.castShadow=false;
    mesh.receiveShadow=false;
    mesh.frustumCulled=true;
    mesh.renderOrder=10;
    group.add(mesh);
    return mesh;
  }

  for(const x of [-u.x,u.x]){
    const side=x<0?"left":"right";
    const innerSign=x<0?1:-1;
    const outerSign=-innerSign;

    makeExtensionStrip(
      `real_100m_road_${side}`,
      x,cfg.roadWidth,cfg.roadY,roadGreyMat
    );

    makeExtensionStrip(
      `real_100m_shop_sidewalk_${side}`,
      x+innerSign*cfg.shopSidewalkOffset,
      cfg.shopSidewalkWidth,
      cfg.sidewalkY,
      unifiedSidewalkMat
    );

    const plazaCenterX=
      x+innerSign*(
        cfg.shopSidewalkOffset+
        cfg.shopSidewalkWidth*.5+
        cfg.shopPlazaWidth*.5
      );

    makeExtensionStrip(
      `real_100m_shop_plaza_${side}`,
      plazaCenterX,
      cfg.shopPlazaWidth,
      cfg.plazaY,
      unifiedSidewalkMat
    );

    makeExtensionStrip(
      `real_100m_garden_sidewalk_${side}`,
      x+outerSign*cfg.gardenSidewalkOffset,
      cfg.gardenSidewalkWidth,
      cfg.sidewalkY,
      unifiedSidewalkMat
    );

    makeExtensionStrip(
      `real_100m_inner_line_${side}`,
      x+innerSign*cfg.innerLineOffset,
      cfg.lineWidth,
      cfg.lineY,
      roadMarkingMat
    );

    makeExtensionStrip(
      `real_100m_outer_line_${side}`,
      x+outerSign*cfg.outerLineOffset,
      cfg.lineWidth,
      cfg.lineY,
      roadMarkingMat
    );

  }

  // One InstancedMesh replaces the 80 individual extension dash meshes.
  // Same visual result, dramatically fewer WebGL draw calls.
  const dashDistances=[];
  for(let d=cfg.dashStart;d<cfg.length;d+=cfg.dashStep){
    dashDistances.push(d);
  }

  const dashGeometry=
    new THREE.PlaneGeometry(
      cfg.dashWidth,
      cfg.dashLength
    );

  dashGeometry.rotateX(-Math.PI/2);

  const dashCount=
    dashDistances.length*2;

  const dashes=
    new THREE.InstancedMesh(
      dashGeometry,
      roadMarkingMat,
      dashCount
    );

  dashes.name=
    "real_100m_center_dashes_instanced";

  dashes.castShadow=false;
  dashes.receiveShadow=false;
  dashes.frustumCulled=true;

  const matrix=
    new THREE.Matrix4();

  let instanceIndex=0;

  for(const x of [-u.x,u.x]){
    for(const d of dashDistances){
      matrix.makeTranslation(
        x,
        cfg.dashY,
        u.backZ-d
      );

      dashes.setMatrixAt(
        instanceIndex++,
        matrix
      );
    }
  }

  dashes.instanceMatrix.needsUpdate=true;
  dashes.computeBoundingSphere();

  group.add(dashes);

  scene.add(group);

  return {
    group,
    limitZ:u.backZ-cfg.length
  };
}


export function buildBuildingConnectedSidewalks(sceneEnvConfig){
  const {
    scene,
    unifiedSidewalkMat
  }=requireRuntime();

  if(!sceneEnvConfig){
    throw new Error(
      "buildBuildingConnectedSidewalks: SCENE_ENV_CONFIG mancante."
    );
  }

  const cfg=ROAD_CONFIG.buildingSidewalks;
  const u=ROAD_CONFIG.uShape;

  function makeWorldUVConcretePlane(
    name,
    w,
    d,
    x,
    y,
    z
  ){
    const geometry=
      new THREE.PlaneGeometry(w,d);

    geometry.rotateX(-Math.PI/2);

    const pos=
      geometry.attributes.position;

    const uv=[];

    for(let i=0;i<pos.count;i++){
      uv.push(
        (pos.getX(i)+x)/cfg.tileSize,
        (pos.getZ(i)+z)/cfg.tileSize
      );
    }

    geometry.setAttribute(
      "uv",
      new THREE.Float32BufferAttribute(
        uv,
        2
      )
    );

    const mesh=
      new THREE.Mesh(
        geometry,
        unifiedSidewalkMat
      );

    mesh.name=name;
    mesh.position.set(x,y,z);
    mesh.receiveShadow=true;

    scene.add(mesh);

    return mesh;
  }

  const frontZ=
    cfg.innerFrontZ;

  makeWorldUVConcretePlane(
    "continuous_front_sidewalk_no_holes",
    sceneEnvConfig.buildingWidth,
    frontZ-sceneEnvConfig.frontZ,
    0,
    cfg.mainY,
    (
      sceneEnvConfig.frontZ+
      frontZ
    )/2
  );

  const roomOuterX=
    sceneEnvConfig.thirdRoomCenterX+
    sceneEnvConfig.roomWidth/2;

  const innerSidewalkX=
    u.x-
    u.radius-
    cfg.curveInnerAdjustment;

  const connectorWidth=
    innerSidewalkX-roomOuterX;

  const connectorCenter=
    (
      innerSidewalkX+
      roomOuterX
    )/2;

  const connectorDepth=
    frontZ-
    sceneEnvConfig.frontZ;

  const connectorCenterZ=
    (
      sceneEnvConfig.frontZ+
      frontZ
    )/2;

  makeWorldUVConcretePlane(
    "left_front_sidewalk_connector_textured",
    connectorWidth,
    connectorDepth,
    -connectorCenter,
    cfg.mainY,
    connectorCenterZ
  );

  makeWorldUVConcretePlane(
    "right_front_sidewalk_connector_textured",
    connectorWidth,
    connectorDepth,
    connectorCenter,
    cfg.mainY,
    connectorCenterZ
  );

  const externalShopOuterX=
    sceneEnvConfig.rightRoomCenterX+
    sceneEnvConfig.roomWidth/2;

  const uInnerSidewalkEdgeX=
    u.x-
    cfg.uInnerEdgeInset;

  const externalSidewalkWidth=
    uInnerSidewalkEdgeX-
    externalShopOuterX;

  const externalSidewalkCenterX=
    (
      uInnerSidewalkEdgeX+
      externalShopOuterX
    )/2;

  const externalSidewalkBackZ=
    Math.max(
      sceneEnvConfig.backZ,
      u.backZ
    );

  const externalSidewalkFrontZ=
    frontZ;

  const externalSidewalkDepth=
    externalSidewalkFrontZ-
    externalSidewalkBackZ;

  const externalSidewalkCenterZ=
    (
      externalSidewalkFrontZ+
      externalSidewalkBackZ
    )/2;

  makeWorldUVConcretePlane(
    "left_external_shop_sidewalk_full",
    externalSidewalkWidth,
    externalSidewalkDepth,
    -externalSidewalkCenterX,
    cfg.externalY,
    externalSidewalkCenterZ
  );

  makeWorldUVConcretePlane(
    "right_external_shop_sidewalk_full",
    externalSidewalkWidth,
    externalSidewalkDepth,
    externalSidewalkCenterX,
    cfg.externalY,
    externalSidewalkCenterZ
  );
}


export function buildOuterContinuousRoadLines(){
  const {
    uRoadCurve
  }=requireRuntime();

  const cfg=ROAD_CONFIG.outerLine;

  const material=
    new THREE.MeshStandardMaterial({
      color:cfg.color,
      roughness:cfg.roughness,
      metalness:0,
      side:THREE.DoubleSide
    });

  makeFlatCurveBorder(
    "u_road_shop_outer_continuous_line",
    uRoadCurve,
    cfg.shopOffset,
    cfg.y,
    cfg.width,
    material,
    cfg.segments
  );

  makeFlatCurveBorder(
    "u_road_beach_outer_continuous_line",
    uRoadCurve,
    cfg.beachOffset,
    cfg.y,
    cfg.width,
    material,
    cfg.segments
  );
}
