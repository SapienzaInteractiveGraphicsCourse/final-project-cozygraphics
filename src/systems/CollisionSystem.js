// CollisionSystem PASS6 - shared collision definitions.
// CollisionSystem.js
// Reusable collision geometry, scene builders and Casino collider definitions.
// Scene-specific object references and tuning values stay in main.html.

export function createCollisionState(){
  return {
    enabled:true,
    playerRadius:.437,
    nearbyRadius:12.0,
    nearbyRadiusSq:12.0*12.0,
    dynamicBroadphasePadding:2.0,
    static:[],
    dynamic:[],
    objectMap:new Map(),
    built:false,
    dynamicAccumulator:0,
    dynamicStep:1/12
  };
}


/* ==========================================================
   COLLISION CONFIGURATION
   Game-specific collision definitions kept outside main.html.
   CAR_COLLISION_EDIT intentionally stays in main.html for now.
   ========================================================== */


export const CAR_COLLISION_EDIT={
  offsetForward:8.10,
  offsetRight:3.50,
  lengthScale:1.80,
  widthScale:1.65,
  heightScale:1.50,
  roundness:0.55,
  yawOffsetDeg:0.0
};

export const PLAYER_CYLINDER_COLLIDER={
  ready:true,
  radius:.820,
  height:3.100,
  offsetX:0.000,
  offsetY:0.000,
  offsetZ:0.000,
  bottomY:.050,
  manual:true
};

export const GARDEN_GATE_COLLISION_FIXED={
  step:.05,
  left:{
    x:0,
    y:0,
    z:0,
    width:8.00,
    height:1.00,
    depth:.05,
    rotY:0.0
  },
  right:{
    x:0,
    y:0,
    z:0,
    width:17.10,
    height:1.00,
    depth:.10,
    rotY:3.0
  }
};

export const CASINO_WALL_COLLIDER_EDIT={
  x:-32.900,
  z:-20.200,
  length:45.600,
  thickness:0.350,
  yawDeg:90.0
};

export const CASINO_COLLIDER_EDIT={
  pokerTable:{
    shape:"ellipse",
    majorScale:.520,
    minorScale:.580,
    heightScale:.780,
    offsetX:0.000,
    offsetZ:0.000,
    yawOffsetDeg:0.0
  },

  reception:{
    shape:"cylinder",
    radiusScale:.500,
    heightScale:.720,
    offsetX:0.000,
    offsetZ:0.000
  },

  casinoWoman:{
    shape:"cylinder",
    radiusScale:.30,
    heightScale:.52,
    offsetX:0,
    offsetZ:0
  },

  child:{
    shape:"cylinder",
    radiusScale:.400,
    heightScale:.480,
    offsetX:0.000,
    offsetZ:0.000
  },

  casinoBoy:{
    shape:"cylinder",
    radiusScale:.620,
    heightScale:.520,
    offsetX:0.000,
    offsetZ:0.000
  },

  tv:{
    shape:"screenBox",
    widthScale:1.000,
    depthScale:1.000,
    heightScale:1.000,
    offsetX:0.000,
    offsetZ:0.000,
    yawOffsetDeg:-90.0
  },

  tv2:{
    shape:"screenBox",
    widthScale:1.000,
    depthScale:1.000,
    heightScale:1.000,
    offsetX:0.000,
    offsetZ:0.000,
    yawOffsetDeg:0.0
  },

  jukebox:{
    shape:"box",
    widthScale:1.460,
    depthScale:.720,
    heightScale:.920,
    offsetX:0.000,
    offsetZ:0.000
  },

  clawMachine:{
    shape:"box",
    widthScale:.76,
    depthScale:.76,
    heightScale:1.00,
    offsetX:0,
    offsetZ:0
  }
};

export const GARDEN_COLLISION_EDITOR_REGISTRY=new Map();

export const DEFINITIVE_GARDEN_TREE_COLLISIONS=[
  {name:"garden_manual_tree_left_1",  x:-44.400, z:94.000,  radius:.470, yMin:0.000, yMax:28.000},
  {name:"garden_manual_tree_left_2",  x:-52.400, z:132.000, radius:.720, yMin:0.000, yMax:28.000},
  {name:"garden_manual_tree_left_3",  x:-56.700, z:95.700,  radius:.420, yMin:0.000, yMax:28.000},
  {name:"garden_manual_tree_left_4",  x:-56.600, z:117.700, radius:.620, yMin:0.000, yMax:28.000},
  {name:"garden_manual_tree_left_5",  x:-61.400, z:101.000, radius:.820, yMin:0.000, yMax:28.000},
  {name:"garden_manual_tree_left_6",  x:-70.800, z:97.800,  radius:.620, yMin:0.000, yMax:28.000},
  {name:"garden_manual_tree_right_1", x:53.800,  z:112.000, radius:.520, yMin:0.000, yMax:28.000},
  {name:"garden_manual_tree_right_2", x:51.000,  z:124.000, radius:.320, yMin:0.000, yMax:28.000},
  {name:"garden_manual_tree_right_3", x:66.200,  z:144.400, radius:1.120, yMin:0.000, yMax:28.000},
  {name:"garden_manual_tree_right_4", x:48.000,  z:138.100, radius:.620, yMin:0.000, yMax:28.000}
];

export function makeBoxCollider(
  state,
  name,cx,cz,hx,hz,
  yMin=-Infinity,
  yMax=Infinity,
  source=null,
  yaw=0
){
  const box={
    name,
    cx,cz,
    hx:Math.max(.04,hx),
    hz:Math.max(.04,hz),
    yMin,yMax,
    source,
    yaw:Number.isFinite(yaw)?yaw:0
  };
  state.static.push(box);
  if(source?.uuid) state.objectMap.set(source.uuid,box);
  return box;
}

export function makeCylinderCollider(
  state,
  name,
  cx,
  cz,
  radius,
  yMin=-Infinity,
  yMax=Infinity,
  source=null
){
  const r=Math.max(.04,radius);
  const collider={
    type:"cylinder",
    shape:"circle",
    name,
    cx,cz,
    radius:r,
    hx:r,
    hz:r,
    yMin,yMax,
    source,
    yaw:0
  };
  state.static.push(collider);
  if(source?.uuid) state.objectMap.set(source.uuid,collider);
  return collider;
}

export function getColliderBounds(THREE,obj){
  if(!obj) return null;
  obj.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(obj);
  if(box.isEmpty()) return null;
  const size=box.getSize(new THREE.Vector3());
  const center=box.getCenter(new THREE.Vector3());
  if(!Number.isFinite(size.x+size.y+size.z)) return null;
  return {box,size,center};
}

export function addObjectBoxCollider(
  THREE,
  state,
  obj,
  {
    name=obj?.name || "object",
    shrinkX=.88,
    shrinkZ=.88,
    minHorizontal=.35,
    maxHorizontal=40,
    minHeight=.20
  }={}
){
  if(!obj) return null;
  const bounds=getColliderBounds(THREE,obj);
  if(!bounds) return null;
  const horizontal=Math.max(bounds.size.x,bounds.size.z);
  if(horizontal<minHorizontal || horizontal>maxHorizontal) return null;
  if(bounds.size.y<minHeight) return null;

  const old=state.objectMap.get(obj.uuid);
  if(old){
    const index=state.static.indexOf(old);
    if(index>=0) state.static.splice(index,1);
    state.objectMap.delete(obj.uuid);
  }

  return makeBoxCollider(
    state,
    name,
    bounds.center.x,
    bounds.center.z,
    Math.max(.05,bounds.size.x*.5*shrinkX),
    Math.max(.05,bounds.size.z*.5*shrinkZ),
    bounds.box.min.y,
    bounds.box.max.y,
    obj
  );
}

export function circleBoxOverlap(THREE,px,pz,r,box){
  const dx=px-box.cx;
  const dz=pz-box.cz;
  const c=Math.cos(box.yaw||0);
  const s=Math.sin(box.yaw||0);
  const lx= dx*c + dz*s;
  const lz=-dx*s + dz*c;
  const nearestX=THREE.MathUtils.clamp(lx,-box.hx,box.hx);
  const nearestZ=THREE.MathUtils.clamp(lz,-box.hz,box.hz);
  const qx=lx-nearestX;
  const qz=lz-nearestZ;
  return qx*qx+qz*qz < r*r;
}

export function circleRoundedBoxOverlap(THREE,px,pz,r,box){
  const yaw=box.yaw||0;
  const dx=px-box.cx;
  const dz=pz-box.cz;
  const c=Math.cos(-yaw);
  const s=Math.sin(-yaw);
  const lx=dx*c-dz*s;
  const lz=dx*s+dz*c;
  const hx=Math.max(.001,box.hx||.001);
  const hz=Math.max(.001,box.hz||.001);
  const normalizedRoundness=THREE.MathUtils.clamp(box.roundness||0,0,.98);
  const cornerRadius=Math.min(hx,hz)*normalizedRoundness;
  const innerHx=Math.max(0,hx-cornerRadius);
  const innerHz=Math.max(0,hz-cornerRadius);
  const qx=Math.abs(lx)-innerHx;
  const qz=Math.abs(lz)-innerHz;
  const outsideX=Math.max(qx,0);
  const outsideZ=Math.max(qz,0);
  const outsideDistanceSq=outsideX*outsideX+outsideZ*outsideZ;
  const insideDistance=Math.min(Math.max(qx,qz),0);
  const signedDistance=Math.sqrt(outsideDistanceSq)+insideDistance-cornerRadius;
  return signedDistance<=r;
}

export function playerCylinderVsStaticCollider(THREE,cx,cz,r,collider){
  if(collider?.type==="ellipse"){
    const dx=cx-collider.cx;
    const dz=cz-collider.cz;
    const c=Math.cos(-(collider.yaw||0));
    const s=Math.sin(-(collider.yaw||0));
    const lx=dx*c-dz*s;
    const lz=dx*s+dz*c;
    const rx=Math.max(.05,(collider.majorRadius||collider.hx||.05)+r);
    const rz=Math.max(.05,(collider.minorRadius||collider.hz||.05)+r);
    return (lx*lx)/(rx*rx)+(lz*lz)/(rz*rz)<=1;
  }
  if(collider?.type==="cylinder"){
    const dx=cx-collider.cx;
    const dz=cz-collider.cz;
    const rr=r+(collider.radius||collider.hx||.25);
    return dx*dx+dz*dz < rr*rr;
  }
  return circleBoxOverlap(THREE,cx,cz,r,collider);
}


// Generic ellipse collider used by Casino tables and any future oval object.
export function makeEllipseCollider(
  state,
  name,
  cx,
  cz,
  majorRadius,
  minorRadius,
  yMin=-Infinity,
  yMax=Infinity,
  source=null,
  yaw=0
){
  const collider={
    type:"ellipse",
    name,
    cx,cz,
    majorRadius:Math.max(.05,majorRadius),
    minorRadius:Math.max(.05,minorRadius),
    hx:Math.max(.05,majorRadius),
    hz:Math.max(.05,minorRadius),
    yMin,yMax,
    yaw:Number.isFinite(yaw)?yaw:0,
    source
  };
  state.static.push(collider);
  if(source?.uuid) state.objectMap.set(source.uuid,collider);
  return collider;
}

// Room shell/front-opening collision definitions.
// Main supplies the scene/config and decides when this builder runs.
export function buildCoreArchitectureCollisions({
  state,
  scene,
  config,
  bounds,
  makeBox,
  addObjectBox,
  skipExteriorNames=[]
}){
  const cfg=config;
  const halfW=cfg.roomWidth*.5;
  const halfD=(cfg.frontZ-cfg.backZ)*.5;
  const centerZ=(cfg.frontZ+cfg.backZ)*.5;
  const t=Math.max(.20,cfg.wallThickness*.46);
  const yMin=-1;
  const yMax=cfg.roomHeight+1;

  const buildRoom=(prefix,centerX,doorOffsetX=0)=>{
    makeBox(`${prefix}_back`,centerX,cfg.backZ,halfW,t,yMin,yMax);
    makeBox(`${prefix}_left`,centerX-halfW,centerZ,t,halfD,yMin,yMax);
    makeBox(`${prefix}_right`,centerX+halfW,centerZ,t,halfD,yMin,yMax);
    const doorX=centerX+doorOffsetX;
    const roomLeft=centerX-halfW;
    const roomRight=centerX+halfW;
    const leftEdge=doorX-cfg.doorWidth*.5;
    const rightEdge=doorX+cfg.doorWidth*.5;
    const leftW=Math.max(.1,leftEdge-roomLeft);
    const rightW=Math.max(.1,roomRight-rightEdge);
    makeBox(`${prefix}_front_left`,roomLeft+leftW*.5,cfg.frontZ,leftW*.5,t,yMin,yMax);
    makeBox(`${prefix}_front_right`,rightEdge+rightW*.5,cfg.frontZ,rightW*.5,t,yMin,yMax);
  };

  buildRoom("shop_left",cfg.leftRoomCenterX,cfg.leftDoorOffsetX);
  buildRoom("shop_right",cfg.rightRoomCenterX,0);

  const tokens=[
    "facade_body","partition","interior_wall",
    "outer_front_round_corner","outer_back_round_corner"
  ];

  scene.traverse(obj=>{
    if(!obj?.visible) return;
    const n=(obj.name||"").toLowerCase();
    if(!tokens.some(tk=>n.includes(tk))) return;
    const b=bounds(obj);
    if(!b) return;
    const horizontal=Math.max(b.size.x,b.size.z);
    if(horizontal<.35 || horizontal>55 || b.size.y<.6) return;
    addObjectBox(obj,{
      name:`facade_${obj.name||obj.uuid}`,
      shrinkX:.96,shrinkZ:.96,
      minHorizontal:.35,maxHorizontal:55,minHeight:.6
    });
  });

  const exteriorTokens=[
    "facade","outer","shop","casino","pub","club","building",
    "front_wall","back_wall","left_wall","right_wall"
  ];
  const skip=new Set(skipExteriorNames.map(v=>String(v).toLowerCase()));

  scene.traverse(obj=>{
    if(!obj?.visible) return;
    const n=(obj.name||"").toLowerCase();
    if(!exteriorTokens.some(t=>n.includes(t))) return;
    if(
      n.includes("casino_betting_sheet") ||
      n.includes("betting_sheet_2_program") ||
      n.includes("betting_sheet_program")
    ) return;
    if(skip.has(n)) return;

    const b=bounds(obj);
    if(!b) return;
    const horizontal=Math.max(b.size.x,b.size.z);
    if(horizontal<.45 || horizontal>70 || b.size.y<.65) return;
    if(state.objectMap.has(obj.uuid)) return;
    addObjectBox(obj,{
      name:`exterior_${obj.name||obj.uuid}`,
      shrinkX:.97,shrinkZ:.97,
      minHorizontal:.45,maxHorizontal:70,minHeight:.65
    });
  });
}

// Static blockers for the architectural doors.
// Main keeps the actual scene config and invokes this after GLB loading.
export function rebuildArchitecturalDoorCollisionData({
  state,
  config,
  makeBox
}){
  const names=new Set(["door_collider_casino","door_collider_pub"]);
  state.static=state.static.filter(c=>!names.has(String(c?.name||"")));

  const cfg=config;
  const halfWidth=Math.max(.20,(cfg.doorWidth*1.10)*.5);
  const halfDepth=Math.max(.12,cfg.doorThickness*.55);
  const yMin=-.10;
  const yMax=cfg.doorHeight*1.14;
  const casinoX=cfg.leftRoomCenterX+cfg.leftDoorOffsetX;
  const pubX=cfg.rightRoomCenterX;
  const z=cfg.doorZ+.18;

  makeBox("door_collider_casino",casinoX,z,halfWidth,halfDepth,yMin,yMax);
  makeBox("door_collider_pub",pubX,z,halfWidth,halfDepth,yMin,yMax);
}

export function removeLegacyCasinoColliders(state){
  const exactLegacyNames=new Set([
    "exterior_casino_poker_table",
    "exterior_casino_reception",
    "exterior_casino_receptionist_girl",
    "exterior_casino_claw_machine_complete",
    "exterior_casino_jukebox",
    "exterior_casino_tv_sony",
    "exterior_casino_tv_sony_2",
    "exterior_casino_boy",
    "exterior_casino_child"
  ]);

  state.static=state.static.filter(collider=>{
    const name=String(collider?.name||"");
    if(name.startsWith("casino_editable_")) return false;
    if(name==="casino_tv_screen_tv" || name==="casino_tv_screen_tv2") return false;
    if(exactLegacyNames.has(name)) return false;
    if(
      name.startsWith("exterior_") &&
      (
        name.includes("casino_poker_table") ||
        name.includes("casino_receptionist_girl") ||
        name.includes("casino_reception") ||
        name.includes("casino_claw_machine_complete") ||
        name.includes("casino_jukebox") ||
        name.includes("casino_tv_sony") ||
        name.includes("casino_betting_sheet") ||
        name.includes("betting_sheet_2_program") ||
        name.includes("betting_sheet_program")
      )
    ) return false;
    return true;
  });
}

export function getCasinoTvScreenColliderSource(objects,key){
  const root=key==="tv2" ? objects?.bettingOverlay2 : objects?.bettingOverlay;
  if(!root) return null;
  let backing=null;
  root.traverse?.(obj=>{
    if(backing || !obj?.isMesh) return;
    const n=String(obj.name||"").toLowerCase();
    if(n.includes("backing")) backing=obj;
  });
  return backing || root;
}

// Builds the configured Casino colliders from object references supplied by main.
// The tuning/config remains in main.html; only reusable collider construction lives here.
export function rebuildCasinoEditableColliderData({
  THREE,
  state,
  objects,
  edits,
  bounds,
  makeBox,
  makeCylinder,
  makeEllipse,
  wallEdit=null
}){
  if(!state?.built) return;
  removeLegacyCasinoColliders(state);

  const addCylinder=(key,obj,edit)=>{
    if(!obj || !obj.parent || obj.visible===false) return;
    const b=bounds(obj);
    if(!b) return;
    const radius=Math.max(.18,Math.min(b.size.x,b.size.z)*Math.max(.05,edit.radiusScale));
    const minY=b.box.min.y-.05;
    const wantedHeight=Math.max(.30,b.size.y*Math.max(.05,edit.heightScale));
    const maxY=Math.min(b.box.max.y+.05,minY+wantedHeight);
    makeCylinder(
      `casino_editable_${key}`,
      b.center.x+(edit.offsetX||0),
      b.center.z+(edit.offsetZ||0),
      radius,minY,maxY,obj
    );
  };

  const addEllipse=(key,obj,edit)=>{
    if(!obj || !obj.parent || obj.visible===false) return;
    const b=bounds(obj);
    if(!b) return;
    const q=new THREE.Quaternion();
    obj.getWorldQuaternion(q);
    const baseYaw=new THREE.Euler().setFromQuaternion(q,"YXZ").y;
    const yaw=baseYaw+THREE.MathUtils.degToRad(edit.yawOffsetDeg||0);
    const majorRadius=Math.max(.18,Math.max(b.size.x,b.size.z)*Math.max(.05,edit.majorScale));
    const minorRadius=Math.max(.18,Math.min(b.size.x,b.size.z)*Math.max(.05,edit.minorScale));
    const minY=b.box.min.y-.05;
    const wantedHeight=Math.max(.30,b.size.y*Math.max(.05,edit.heightScale));
    const maxY=Math.min(b.box.max.y+.05,minY+wantedHeight);
    makeEllipse(
      `casino_editable_${key}`,
      b.center.x+(edit.offsetX||0),
      b.center.z+(edit.offsetZ||0),
      majorRadius,minorRadius,minY,maxY,obj,yaw
    );
  };

  const addScreenBox=(key,edit)=>{
    const source=getCasinoTvScreenColliderSource(objects,key);
    if(!source || !source.parent || source.visible===false) return;
    const b=bounds(source);
    if(!b) return;
    const q=new THREE.Quaternion();
    source.getWorldQuaternion(q);
    const yaw=new THREE.Euler().setFromQuaternion(q,"YXZ").y+
      THREE.MathUtils.degToRad(edit.yawOffsetDeg||0);
    const minY=b.box.min.y-.02;
    const maxY=minY+Math.max(.12,b.size.y*Math.max(.05,edit.heightScale));
    makeBox(
      `casino_tv_screen_${key}`,
      b.center.x+(edit.offsetX||0),
      b.center.z+(edit.offsetZ||0),
      Math.max(.05,b.size.x*.5*Math.max(.05,edit.widthScale)),
      Math.max(.025,b.size.z*.5*Math.max(.05,edit.depthScale)),
      minY,maxY,source,yaw
    );
  };

  const addBox=(key,obj,edit)=>{
    if(!obj || !obj.parent || obj.visible===false) return;
    const b=bounds(obj);
    if(!b) return;
    const q=new THREE.Quaternion();
    obj.getWorldQuaternion(q);
    const yaw=new THREE.Euler().setFromQuaternion(q,"YXZ").y;
    const heightScale=Math.max(.05,edit.heightScale||1);
    const minY=b.box.min.y-.05;
    const maxY=minY+Math.max(.30,b.size.y*heightScale);
    makeBox(
      `casino_editable_${key}`,
      b.center.x+(edit.offsetX||0),
      b.center.z+(edit.offsetZ||0),
      Math.max(.18,b.size.x*.5*Math.max(.05,edit.widthScale)),
      Math.max(.18,b.size.z*.5*Math.max(.05,edit.depthScale)),
      minY,maxY,obj,yaw
    );
  };

  for(const [key,edit] of Object.entries(edits||{})){
    const obj=objects?.[key];
    if(edit.shape==="cylinder") addCylinder(key,obj,edit);
    else if(edit.shape==="ellipse") addEllipse(key,obj,edit);
    else if(edit.shape==="screenBox") addScreenBox(key,edit);
    else addBox(key,obj,edit);
  }

  if(wallEdit){
    state.static=state.static.filter(c=>String(c?.name||"")!=="casino_wall_collider");
    makeBox(
      "casino_wall_collider",
      wallEdit.x,
      wallEdit.z,
      Math.max(.05,wallEdit.length*.5),
      Math.max(.05,wallEdit.thickness*.5),
      -.05,.40,null,
      THREE.MathUtils.degToRad(wallEdit.yawDeg)
    );
  }
}

// Garden collisions.
// These helpers manage Garden collider data.
// Main still decides when the Garden collision builders run.

export function rememberGardenCollision(registry,collider,meta={}){
  if(!collider?.name) return collider;
  collider.editorGroup=meta.group||"GARDEN";
  collider.editorLabel=meta.label||collider.name;
  registry.set(collider.name,collider);
  return collider;
}

export function removeGardenCollisionPrefix(state,registry,prefix){
  state.static=state.static.filter(
    collider=>!String(collider.name||"").startsWith(prefix)
  );
  for(const key of [...registry.keys()]){
    if(String(key).startsWith(prefix)) registry.delete(key);
  }
}

export function addGardenCylinderCollision(
  THREE,state,registry,obj,name,
  {
    radiusScale=.16,
    minRadius=.18,
    maxRadius=1.20,
    group="GARDEN",
    label=name
  }={}
){
  if(!obj || obj.visible===false || !obj.parent) return null;
  const bounds=getColliderBounds(THREE,obj);
  if(!bounds) return null;
  const radius=THREE.MathUtils.clamp(
    Math.min(bounds.size.x,bounds.size.z)*radiusScale,
    minRadius,
    maxRadius
  );
  const collider=makeCylinderCollider(
    state,name,
    bounds.center.x,bounds.center.z,
    radius,
    bounds.box.min.y,bounds.box.max.y,
    obj
  );
  return rememberGardenCollision(registry,collider,{group,label});
}

export function addGardenBoxCollision(
  THREE,state,registry,obj,name,
  {
    shrinkX=.90,
    shrinkZ=.90,
    group="GARDEN",
    label=name
  }={}
){
  if(!obj || obj.visible===false || !obj.parent) return null;
  obj.updateMatrixWorld(true);
  const bounds=getColliderBounds(THREE,obj);
  if(!bounds) return null;
  const quaternion=new THREE.Quaternion();
  obj.getWorldQuaternion(quaternion);
  const yaw=new THREE.Euler().setFromQuaternion(quaternion,"YXZ").y;
  const collider=makeBoxCollider(
    state,name,
    bounds.center.x,bounds.center.z,
    Math.max(.06,bounds.size.x*.5*shrinkX),
    Math.max(.06,bounds.size.z*.5*shrinkZ),
    bounds.box.min.y,bounds.box.max.y,
    obj,yaw
  );
  return rememberGardenCollision(registry,collider,{group,label});
}

export function addGardenPanelCollision(
  THREE,state,registry,obj,name,label
){
  if(!obj || obj.visible===false || !obj.parent) return null;
  const board=
    obj.getObjectByName?.("panel_piece_board") ||
    obj.getObjectByName?.("board") ||
    obj;
  board.updateMatrixWorld(true);
  const bounds=getColliderBounds(THREE,board);
  if(!bounds) return null;
  const quaternion=new THREE.Quaternion();
  board.getWorldQuaternion(quaternion);
  const visualYaw=new THREE.Euler().setFromQuaternion(quaternion,"YXZ").y;
  const yaw=visualYaw+Math.PI*.5;
  const collider=makeBoxCollider(
    state,name,
    bounds.center.x,bounds.center.z,
    Math.max(.08,bounds.size.z*.5*.96),
    Math.max(.08,bounds.size.x*.5*.96),
    bounds.box.min.y,bounds.box.max.y,
    board,yaw
  );
  return rememberGardenCollision(
    registry,
    collider,
    {group:"EXHIBITION PANELS",label}
  );
}

// ---------------------------------------------------------------------------
// Outside / road collisions.
// Casino interior collision builders stay in main.html.
// ---------------------------------------------------------------------------

export function buildEditableFenceCollisions({
  state,
  editableFenceSystem,
  bounds,
  makeBox
}){
  state.static=state.static.filter(
    collider=>!String(collider.name).startsWith("fence_")
  );

  if(!editableFenceSystem) return;

  for(let i=0;i<editableFenceSystem.children.length;i++){
    const piece=editableFenceSystem.children[i];
    if(!piece?.visible) continue;

    const box=bounds(piece);
    if(!box) continue;

    const horizontal=Math.max(box.size.x,box.size.z);
    if(horizontal<.20) continue;

    makeBox(
      `fence_${i}`,
      box.center.x,
      box.center.z,
      Math.max(.05,box.size.x*.5*.82),
      Math.max(.05,box.size.z*.5*.82),
      box.box.min.y,
      box.box.max.y,
      piece
    );
  }
}

export function syncCharacterCollisions({
  THREE,
  state,
  npcs,
  eventGirl,
  bounds
}){
  const desired=new Map();

  for(const npc of npcs||[]){
    const root=npc?.root;
    if(!root || root.visible===false) continue;

    const name=
      `npc_${npc?.name || root.name || root.uuid}`;

    let radius=
      root.userData.__lightCollisionRadius;

    if(!Number.isFinite(radius)){
      const box=bounds(root);

      radius=box
        ? THREE.MathUtils.clamp(
            Math.max(box.size.x,box.size.z)*.27,
            .391,
            .644
          )
        : .506;

      root.userData.__lightCollisionRadius=radius;
    }

    desired.set(name,{root,radius});
  }

  if(eventGirl?.ready && eventGirl.root?.visible!==false){
    const root=eventGirl.root;

    let radius=
      root.userData.__lightCollisionRadius;

    if(!Number.isFinite(radius)){
      const box=bounds(root);

      radius=box
        ? THREE.MathUtils.clamp(
            Math.max(box.size.x,box.size.z)*.27,
            .39,
            .62
          )
        : .48;

      root.userData.__lightCollisionRadius=radius;
    }

    desired.set(
      "npc_garden_girl",
      {root,radius}
    );
  }

  for(const dyn of state.dynamic){
    if(!dyn.character) continue;
    dyn.active=desired.has(dyn.name);
  }

  for(const [name,data] of desired){
    let dyn=
      state.dynamic.find(
        collider=>collider.name===name
      );

    if(!dyn){
      dyn={
        name,
        x:0,
        z:0,
        radius:data.radius,
        active:true,
        character:true
      };

      state.dynamic.push(dyn);
    }

    dyn.x=data.root.position.x;
    dyn.z=data.root.position.z;
    dyn.radius=data.radius;
    dyn.active=true;
  }
}

export function syncCarCollisions({
  THREE,
  state,
  cars,
  crosswalk,
  carCollisionEdit
}){
  const activeNames=new Set();

  const worldPos=new THREE.Vector3();
  const worldQuat=new THREE.Quaternion();
  const worldEuler=new THREE.Euler();

  for(const car of cars||[]){
    const root=car?.root;
    if(!root || root.visible===false) continue;

    const profile=
      root.userData?.collisionProfile;

    if(!profile) continue;

    root.updateMatrixWorld(true);
    root.getWorldPosition(worldPos);
    root.getWorldQuaternion(worldQuat);
    worldEuler.setFromQuaternion(worldQuat,"YXZ");

    let yaw=worldEuler.y;

    if(!profile.longAxisX){
      yaw+=Math.PI/2;
    }

    const edit=carCollisionEdit || {
      offsetForward:9.00,
      offsetRight:3.80,
      lengthScale:2.05,
      widthScale:1.85,
      heightScale:1.50,
      roundness:0.55,
      yawOffsetDeg:0
    };

    yaw+=THREE.MathUtils.degToRad(
      edit.yawOffsetDeg
    );

    const length=
      profile.length*edit.lengthScale;

    const width=
      profile.width*edit.widthScale;

    const carBodyMargin=
      Math.max(length,width)*.55;

    const collisionTailMeters=8.0;

    const crosswalkMargin=
      carBodyMargin+
      collisionTailMeters;

    const carOnCrosswalk=
      Math.abs(
        worldPos.x-crosswalk.centerX
      ) <=
        crosswalk.halfWidth+
        crosswalkMargin &&
      worldPos.z >=
        crosswalk.roadMinZ-
        crosswalkMargin &&
      worldPos.z <=
        crosswalk.roadMaxZ+
        crosswalkMargin;

    if(!carOnCrosswalk){
      continue;
    }

    const forwardX=Math.cos(yaw);
    const forwardZ=-Math.sin(yaw);
    const rightX=-forwardZ;
    const rightZ=forwardX;

    const colliderX=
      worldPos.x+
      forwardX*edit.offsetForward+
      rightX*edit.offsetRight;

    const colliderZ=
      worldPos.z+
      forwardZ*edit.offsetForward+
      rightZ*edit.offsetRight;

    const name=`car_${root.uuid}`;

    activeNames.add(name);

    let dyn=
      state.dynamic.find(
        collider=>collider.name===name
      );

    if(!dyn){
      dyn={
        name,
        box:true,
        car:true,
        active:true,
        x:0,
        z:0,
        hx:.5,
        hz:.5,
        yaw:0
      };

      state.dynamic.push(dyn);
    }

    dyn.x=colliderX;
    dyn.z=colliderZ;
    dyn.hx=length*.5;
    dyn.hz=width*.5;
    dyn.height=
      Math.max(
        .20,
        1.50*(edit.heightScale||1)
      );

    dyn.roundness=
      THREE.MathUtils.clamp(
        edit.roundness??0,
        0,
        .98
      );

    dyn.yaw=yaw;
    dyn.active=true;
  }

  for(const dyn of state.dynamic){
    if(!dyn.car) continue;

    if(!activeNames.has(dyn.name)){
      dyn.active=false;
    }
  }
}

export function dynamicCollisionBlockedAt({
  state,
  x,
  z,
  circleBox,
  circleRoundedBox
}){
  const radius=state.playerRadius;
  const padding=state.dynamicBroadphasePadding;

  const proxy={
    cx:0,
    cz:0,
    hx:0,
    hz:0,
    yaw:0,
    roundness:0
  };

  for(const dyn of state.dynamic){
    if(!dyn.active) continue;

    const dx=x-dyn.x;
    const dz=z-dyn.z;

    if(dyn.box || dyn.door){
      const reach=
        Math.hypot(dyn.hx||0,dyn.hz||0)+
        radius+
        padding;

      if(dx*dx+dz*dz>reach*reach){
        continue;
      }

      proxy.cx=dyn.x;
      proxy.cz=dyn.z;
      proxy.hx=dyn.hx;
      proxy.hz=dyn.hz;
      proxy.yaw=dyn.yaw||0;
      proxy.roundness=dyn.roundness||0;

      if(
        dyn.car
          ? circleRoundedBox(
              x,z,radius,proxy
            )
          : circleBox(
              x,z,radius,proxy
            )
      ){
        return true;
      }

      continue;
    }

    const rr=
      radius+
      (dyn.radius||0);

    if(dx*dx+dz*dz<rr*rr){
      return true;
    }
  }

  return false;
}

export function updateDynamicCarCollisions({
  state,
  dt,
  syncCars
}){
  if(!state.built) return;

  state.dynamicAccumulator+=dt;

  if(
    state.dynamicAccumulator<
    state.dynamicStep
  ){
    return;
  }

  state.dynamicAccumulator%=
    state.dynamicStep;

  syncCars();
}

export function buildBarricadeCollisions({
  THREE,
  state,
  originalBarricades,
  largeBarricadeGroup,
  bounds,
  makeBox
}){
  state.static=
    state.static.filter(
      collider=>
        !String(collider.name).startsWith("barricade_") &&
        !String(collider.name).startsWith("large_barricade_") &&
        !String(collider.name).startsWith("sidewalk_beach_")
    );

  if(originalBarricades){
    for(const segment of originalBarricades.children){
      if(!segment?.visible) continue;

      segment.updateMatrixWorld(true);

      const box=bounds(segment);
      if(!box) continue;

      const quaternion=
        new THREE.Quaternion();

      segment.getWorldQuaternion(quaternion);

      const yaw=
        new THREE.Euler()
          .setFromQuaternion(
            quaternion,
            "YXZ"
          )
          .y;

      makeBox(
        `barricade_${segment.name}`,
        box.center.x,
        box.center.z,
        Math.max(.08,box.size.x*.5*.91),
        Math.max(.08,box.size.z*.5*.91),
        box.box.min.y,
        box.box.max.y,
        segment,
        yaw
      );
    }
  }

  const colliders=
    largeBarricadeGroup
      ?.userData
      ?.instanceColliders ||
    [];

  for(const item of colliders){
    makeBox(
      `large_barricade_${item.name}`,
      item.x,
      item.z,
      item.halfX,
      item.halfZ,
      item.minY,
      item.maxY,
      largeBarricadeGroup,
      item.yaw
    );
  }
}


// ---------------------------------------------------------------------------
// Garden collisions.
// Visual Garden geometry stays in Garden.js. Collision building is here.
// ---------------------------------------------------------------------------

export function rebuildShopFrontLampCollisionData({
  THREE,
  state,
  registry,
  scene,
  makeCylinder,
  remember
}){
  const names=new Set([
    "shop_front_lamp_left",
    "shop_front_lamp_right"
  ]);

  state.static=
    state.static.filter(
      collider=>
        !names.has(
          String(collider?.name||"")
        )
    );

  for(const key of [...registry.keys()]){
    if(names.has(String(key))){
      registry.delete(key);
    }
  }

  const left=
    scene.getObjectByName(
      "sidewalk_short_lamp_5"
    );

  const right=
    scene.getObjectByName(
      "sidewalk_short_lamp_6"
    );

  const add=(lamp,name,label)=>{
    if(!lamp?.parent) return;

    lamp.updateMatrixWorld(true);

    const box=
      new THREE.Box3()
        .setFromObject(lamp);

    if(box.isEmpty()) return;

    const size=
      box.getSize(
        new THREE.Vector3()
      );

    const center=
      box.getCenter(
        new THREE.Vector3()
      );

    const radius=
      THREE.MathUtils.clamp(
        Math.min(size.x,size.z)*.11,
        .20,
        .46
      );

    const collider=
      makeCylinder(
        name,
        center.x,
        center.z,
        radius,
        box.min.y,
        box.max.y,
        lamp
      );

    remember(
      collider,
      {
        group:"OUTSIDE LAMPS",
        label
      }
    );
  };

  add(
    left,
    "shop_front_lamp_left",
    "Shop front lamp left"
  );

  add(
    right,
    "shop_front_lamp_right",
    "Shop front lamp right"
  );
}

export function rebuildDefinitiveGardenTreeCollisionData({
  state,
  registry,
  treeCollisions,
  makeCylinder
}){
  state.static=
    state.static.filter(collider=>{
      const name=
        String(collider?.name||"");

      return (
        !name.startsWith("garden_prop_tree_") &&
        !name.startsWith("garden_manual_tree_")
      );
    });

  for(const key of [...registry.keys()]){
    const name=String(key);

    if(
      name.startsWith("garden_prop_tree_") ||
      name.startsWith("garden_manual_tree_")
    ){
      registry.delete(key);
    }
  }

  for(const item of treeCollisions){
    makeCylinder(
      item.name,
      item.x,
      item.z,
      item.radius,
      item.yMin,
      item.yMax,
      null
    );
  }
}

export function refreshGardenGatewayPostCollisionData({
  THREE,
  state,
  gatePosts,
  makeBox
}){
  state.static=
    state.static.filter(collider=>{
      const name=
        String(collider?.name||"");

      return !name.startsWith(
        "garden_gateway_post_"
      );
    });

  for(const side of ["left","right"]){
    const post=gatePosts?.[side];

    if(
      !post ||
      post.visible===false ||
      !post.parent
    ){
      continue;
    }

    post.updateMatrixWorld(true);

    const box=
      new THREE.Box3()
        .setFromObject(post);

    if(box.isEmpty()) continue;

    const size=
      box.getSize(
        new THREE.Vector3()
      );

    const center=
      box.getCenter(
        new THREE.Vector3()
      );

    makeBox(
      `garden_gateway_post_${side}`,
      center.x,
      center.z,
      Math.max(.001,size.x*.5),
      Math.max(.001,size.z*.5),
      box.min.y,
      box.max.y,
      post,
      0
    );
  }
}

export function buildGardenBoundaryFenceCollisions({
  state,
  boundaryFence,
  makeBox,
  remember
}){
  state.static=
    state.static.filter(
      collider=>
        !String(collider.name)
          .startsWith(
            "garden_boundary_fence_"
          )
    );

  const group=
    boundaryFence?.group;

  if(!group) return;

  const colliders=
    group.userData?.instanceColliders ||
    [];

  for(const item of colliders){
    const box=
      makeBox(
        `garden_boundary_fence_${item.name}`,
        item.x,
        item.z,
        item.halfX,
        item.halfZ,
        0,
        boundaryFence.height+.35,
        group,
        item.yaw
      );

    remember(
      box,
      {
        group:"PARK FENCE",
        label:item.name
      }
    );
  }
}

export function buildGardenFlowerFenceCollisions({
  state,
  flowerFenceGroup,
  flowerFenceEdit,
  roseFenceEditorState,
  flowerFenceIsHorizontal,
  makeBox
}){
  state.static=
    state.static.filter(
      collider=>
        !String(collider.name||"")
          .startsWith(
            "garden_flower_zone_fence_"
          )
    );

  const group=flowerFenceGroup?.group;
  if(!group) return;

  const gx=group.position.x||0;
  const gy=group.position.y||0;
  const gz=group.position.z||0;

  const sx=Math.abs(group.scale.x||1);
  const sy=Math.abs(group.scale.y||1);
  const sz=Math.abs(group.scale.z||1);

  const thickness=
    flowerFenceGroup.railThickness;

  for(const garden of ["tulips","roses"]){
    const editorState=
      roseFenceEditorState(
        garden==="tulips"
          ? "left"
          : "right"
      );

    for(
      const side of
      ["front","back","left","right"]
    ){
      const data=
        flowerFenceEdit[garden][side];

      const horizontal=
        flowerFenceIsHorizontal(side);

      const worldX=
        gx+
        data.x*sx;

      const worldZ=
        gz+
        data.z*sz;

      const halfX=
        (
          horizontal
            ? data.length*sx
            : thickness*sx
        )*.5;

      const halfZ=
        (
          horizontal
            ? thickness*sz
            : data.length*sz
        )*.5;

      const minY=
        gy+
        editorState.y+
        .08*sy;

      const maxY=
        gy+
        editorState.y+
        (
          .08+
          flowerFenceGroup.height
        )*sy;

      makeBox(
        `garden_flower_zone_fence_${garden}_${side}`,
        worldX,
        worldZ,
        halfX,
        halfZ,
        minY,
        maxY,
        group,
        0
      );
    }
  }
}


// ---------------------------------------------------------------------------
// Player collision core.
// Editor values stay in main.html; only collider logic is handled here.
// ---------------------------------------------------------------------------
export function rebuildPlayerCylinderCollision({THREE,state,player,playerCollider}){
  if(!player?.root) return;
  const visualRoot=player.model || player.root;
  visualRoot.updateMatrixWorld(true);
  const overall=new THREE.Box3().setFromObject(visualRoot);
  if(overall.isEmpty()) return;
  const size=overall.getSize(new THREE.Vector3());
  if(!playerCollider.manual){
    playerCollider.radius=THREE.MathUtils.clamp(Math.max(size.x,size.z)*.24,.38,.52);
    playerCollider.height=THREE.MathUtils.clamp(size.y*.95,2.35,3.10);
    playerCollider.offsetX=0;
    playerCollider.offsetY=0;
    playerCollider.offsetZ=0;
    playerCollider.bottomY=.05;
  }
  playerCollider.radius=Math.max(.05,playerCollider.radius);
  playerCollider.height=Math.max(.20,playerCollider.height);
  state.playerRadius=playerCollider.radius;
  playerCollider.ready=true;
}

export function ensurePlayerCylinderCollision({rebuildPlayer,playerCollider}){
  if(!playerCollider.ready) rebuildPlayer();
}

export function staticCollisionBlockedAt({
  state,playerCollider,x,z,playerY,ensurePlayer,playerVsStatic
}){
  ensurePlayer();
  if(!playerCollider.ready) return false;
  const c=playerCollider;
  const cx=x+c.offsetX;
  const cz=z+c.offsetZ;
  const playerMinY=playerY+c.offsetY+c.bottomY;
  const playerMaxY=playerMinY+c.height;
  for(const box of state.static){
    if(
      Number.isFinite(box.yMin) &&
      Number.isFinite(box.yMax) &&
      (playerMaxY<box.yMin || playerMinY>box.yMax)
    ) continue;
    const obstacleReach=
      box.type==="cylinder"
        ? (box.radius||box.hx||.25)
        : Math.hypot(box.hx||0,box.hz||0);
    const dx=box.cx-cx;
    const dz=box.cz-cz;
    const reach=obstacleReach+c.radius;
    if(dx*dx+dz*dz>reach*reach) continue;
    if(playerVsStatic(cx,cz,c.radius,box)){
      state.lastHitName=box.name||"";
      return true;
    }
  }
  return false;
}

export function collisionBlockedAt({state,x,z,playerY,staticBlockedAt,dynamicBlockedAt}){
  state.lastHitName="";
  if(staticBlockedAt(x,z,playerY)) return true;
  if(dynamicBlockedAt(x,z,playerY)) return true;
  return false;
}

export function resolvePlayerCollisionMovement({
  state,player,previousPosition,isBlockedAt
}){
  if(!state.enabled || !state.built || !player?.root) return;
  const tx=player.root.position.x;
  const tz=player.root.position.z;
  const py=player.root.position.y;
  if(!isBlockedAt(tx,tz,py)) return;

  const dx=tx-previousPosition.x;
  const dz=tz-previousPosition.z;
  let lo=0,hi=1,best=0;

  for(let i=0;i<5;i++){
    const mid=(lo+hi)*.5;
    const mx=previousPosition.x+dx*mid;
    const mz=previousPosition.z+dz*mid;
    if(isBlockedAt(mx,mz,py)) hi=mid;
    else { best=mid; lo=mid; }
  }

  if(best>.08){
    player.root.position.x=previousPosition.x+dx*best;
    player.root.position.z=previousPosition.z+dz*best;
    return;
  }

  const tryX=!isBlockedAt(tx,previousPosition.z,py);
  const tryZ=!isBlockedAt(previousPosition.x,tz,py);

  if(tryX){
    player.root.position.z=previousPosition.z;
    return;
  }
  if(tryZ){
    player.root.position.x=previousPosition.x;
    return;
  }

  player.root.position.x=previousPosition.x;
  player.root.position.z=previousPosition.z;
}

// Generic object/gate collision helpers.
// Gate editor UI and tuning values stay in main.html.
export function removeObjectCollision(state,obj){
  if(!obj) return;
  const old=state.objectMap.get(obj.uuid);
  if(!old) return;
  const i=state.static.indexOf(old);
  if(i>=0) state.static.splice(i,1);
  state.objectMap.delete(obj.uuid);
}

export function rebuildGardenGateLeafCollisionData({
  THREE,state,taskGate,gateParts,tuning,makeBox
}){
  if(taskGate) removeObjectCollision(state,taskGate);
  if(gateParts?.left) removeObjectCollision(state,gateParts.left);
  if(gateParts?.right) removeObjectCollision(state,gateParts.right);

  state.static=state.static.filter(box=>{
    const n=String(box?.name||"").toLowerCase();
    return !(
      n.includes("garden_gate") ||
      n.includes("gate_left") ||
      n.includes("gate_right") ||
      n.includes("left_leaf") ||
      n.includes("right_leaf")
    );
  });

  const addExactLeafBox=(which,leaf)=>{
    if(!leaf || leaf.visible===false || !leaf.parent) return null;
    leaf.updateMatrixWorld(true);
    const bounds=new THREE.Box3().setFromObject(leaf);
    if(bounds.isEmpty()) return null;
    const size=bounds.getSize(new THREE.Vector3());
    const center=bounds.getCenter(new THREE.Vector3());
    const worldQuat=new THREE.Quaternion();
    leaf.getWorldQuaternion(worldQuat);
    const yaw=new THREE.Euler().setFromQuaternion(worldQuat,"YXZ").y;
    const tune=tuning[which];
    const baseHeight=Math.max(.001,size.y);
    const tunedHeight=baseHeight*tune.height;
    const tunedCenterY=center.y+tune.y;
    return makeBox(
      `garden_gate_${which}_box`,
      center.x+tune.x,
      center.z+tune.z,
      Math.max(.001,size.x*.5*tune.width),
      Math.max(.001,size.z*.5*tune.depth),
      tunedCenterY-tunedHeight*.5,
      tunedCenterY+tunedHeight*.5,
      leaf,
      yaw+THREE.MathUtils.degToRad(tune.rotY)
    );
  };

  addExactLeafBox("left",gateParts?.left);
  addExactLeafBox("right",gateParts?.right);
}

// Garden prop collider geometry.
// Editor panels/readouts remain in main.html.
export function buildImportantGardenPropCollisions({
  THREE,state,gardenFeatures,gardenMuseum,newTelescope,telescopeMode,
  palms,outsideLamps,insideLamps,removePrefix,bounds,makeBox,makeCylinder,
  addBox,addCylinder,addPanelBox,remember,rebuildTrees,rebuildTreeShadows
}){
  removePrefix("garden_prop_");

  if(gardenFeatures?.fountain?.parent){
    const b=bounds(gardenFeatures.fountain);
    if(b){
      const radius=Math.max(.45,Math.min(b.size.x,b.size.z)*.46);
      const c=makeCylinder(
        "garden_prop_fountain",
        b.center.x,b.center.z,radius,
        b.box.min.y,b.box.max.y,
        gardenFeatures.fountain
      );
      remember(c,{group:"FOUNTAIN",label:"Fountain"});
    }
  }

  const caseDefs=[
    ["garden_abstract_1_display_case","Amazon display case"],
    ["garden_abstract_2_display_case","Russian display case"],
    ["garden_meteorite_display_case","Meteorite display case"]
  ];
  for(const [prefix,label] of caseDefs){
    const caseObj=gardenMuseum?.editable?.get(`${prefix}:case`) || null;
    addBox(
      caseObj,
      `garden_prop_display_case_${prefix}`,
      {shrinkX:.94,shrinkZ:.94,group:"DISPLAY CASES",label}
    );
  }

  const panelDefs=[
    ["garden_abstract_1_display_case","Amazon panel"],
    ["garden_abstract_2_display_case","Russian panel"],
    ["garden_meteorite_display_case","Meteorite panel"]
  ];
  for(const [prefix,label] of panelDefs){
    const panel=gardenMuseum?.editable?.get(`${prefix}:label`) || null;
    addPanelBox(panel,`garden_prop_panel_${prefix}`,label);
  }

  if(newTelescope?.label){
    addPanelBox(
      newTelescope.label,
      "garden_prop_panel_telescope",
      "Telescope panel"
    );
  }

  if(telescopeMode?.root?.parent){
    const tb=bounds(telescopeMode.root);
    if(tb){
      const radius=Math.max(.25,Math.min(tb.size.x,tb.size.z)*.42);
      const c=makeCylinder(
        "garden_prop_telescope",
        tb.center.x,tb.center.z,radius,
        tb.box.min.y,tb.box.max.y,
        telescopeMode.root
      );
      remember(c,{group:"TELESCOPE",label:"Telescope"});
    }
  }

  rebuildTrees?.();
  rebuildTreeShadows?.();

  let palmCount=0;
  for(const palm of palms||[]){
    if(!palm || palm.visible===false || !palm.parent) continue;
    const b=bounds(palm);
    if(!b) continue;
    const radius=THREE.MathUtils.clamp(
      Math.min(b.size.x,b.size.z)*.11,.28,.72
    );
    const c=makeCylinder(
      `garden_prop_palm_${palmCount}`,
      b.center.x,b.center.z,radius,
      b.box.min.y,b.box.max.y,
      palm
    );
    remember(c,{group:"PALMS",label:`Palm ${palmCount+1}`});
    palmCount++;
  }

  let outsideLampIndex=0;
  for(const lamp of outsideLamps||[]){
    if(!lamp || lamp.visible===false || !lamp.parent) continue;
    addCylinder(
      lamp,
      `garden_prop_outside_lamp_${outsideLampIndex}`,
      {
        radiusScale:.095,minRadius:.15,maxRadius:.42,
        group:"OUTSIDE LAMPS",
        label:`Outside lamp ${outsideLampIndex+1}`
      }
    );
    outsideLampIndex++;
  }

  let insideLampIndex=0;
  for(const lamp of insideLamps||[]){
    if(!lamp || lamp.visible===false || !lamp.parent) continue;
    addCylinder(
      lamp,
      `garden_prop_inside_lamp_${insideLampIndex}`,
      {
        radiusScale:.095,minRadius:.15,maxRadius:.42,
        group:"GARDEN LAMPS",
        label:`Garden lamp ${insideLampIndex+1}`
      }
    );
    insideLampIndex++;
  }

  const approvedNames=new Set([
    "garden_prop_panel_garden_abstract_1_display_case",
    "garden_prop_panel_garden_abstract_2_display_case",
    "garden_prop_panel_telescope",
    "garden_prop_panel_garden_meteorite_display_case",
    "garden_prop_fountain"
  ]);

  state.static=state.static.filter(
    c=>!approvedNames.has(String(c?.name||""))
  );

  const approvedPanel=(name,label,x,z,yMin,yMax,halfX,halfZ,yawDeg)=>{
    const c=makeBox(
      name,x,z,halfX,halfZ,yMin,yMax,null,
      THREE.MathUtils.degToRad(yawDeg)
    );
    remember(c,{group:"EXHIBITION PANELS",label});
  };

  approvedPanel(
    "garden_prop_panel_garden_abstract_1_display_case",
    "Amazon panel",
    -28.701,118.428,1.235,2.299,.917,.080,91.5
  );
  approvedPanel(
    "garden_prop_panel_garden_abstract_2_display_case",
    "Russian panel",
    -28.701,104.328,1.235,2.299,.917,.080,90.0
  );
  approvedPanel(
    "garden_prop_panel_telescope",
    "Telescope panel",
    30.545,118.328,1.359,2.541,1.019,.080,90.0
  );
  approvedPanel(
    "garden_prop_panel_garden_meteorite_display_case",
    "Meteorite panel",
    30.551,104.228,1.235,2.299,.917,.080,90.0
  );

  const fountain=makeCylinder(
    "garden_prop_fountain",
    .600,113.194,3.767,.030,7.787,
    gardenFeatures?.fountain||null
  );
  remember(fountain,{group:"FOUNTAIN",label:"Fountain"});
}



// Dynamic shop/casino door collider sync.
// Door lookup/editor choices stay in main; collision math/state lives here.
export function syncDynamicDoorCollisions({
  THREE,state,doors,bounds
}){
  for(const door of doors||[]){
    if(!door) continue;
    const name=`door_${door.uuid}`;
    let dyn=state.dynamic.find(d=>d.name===name);
    const b=bounds(door);
    if(!b) continue;

    const q=new THREE.Quaternion();
    door.getWorldQuaternion(q);
    const yaw=new THREE.Euler().setFromQuaternion(q,"YXZ").y;

    if(!dyn){
      dyn={
        name,
        box:true,
        door:true,
        active:true,
        x:0,
        z:0,
        hx:.5,
        hz:.2,
        yaw:0
      };
      state.dynamic.push(dyn);
    }

    dyn.x=b.center.x;
    dyn.z=b.center.z;
    dyn.hx=Math.max(.15,b.size.x*.5*.96);
    dyn.hz=Math.max(.10,b.size.z*.5*.96);
    dyn.yaw=yaw;
    dyn.active=door.visible!==false;
  }
}


// Character floor-contact correction.
// Collision/grounding logic lives here; animation/editor state stays in main.
export function solveCharacterFloorContact({
  THREE,
  character,
  player,
  state,
  floorClearance
}){
  if(!character?.model) return;

  if(character===player){
    character.model.position.y=state.modelBaseY;
    character.model.updateMatrixWorld(true);
    return;
  }

  character.model.updateMatrixWorld(true);

  const floorBones=[
    state.bones.leftFoot,
    state.bones.rightFoot,
    state.bones.leftToe,
    state.bones.rightToe
  ].filter(Boolean);

  if(!floorBones.length) return;

  const worldPos=new THREE.Vector3();
  let lowestY=Infinity;

  for(const bone of floorBones){
    bone.getWorldPosition(worldPos);
    lowestY=Math.min(lowestY,worldPos.y);
  }

  const correction=floorClearance-lowestY;

  if(correction>0){
    character.model.position.y+=correction;
  }else{
    character.model.position.y=THREE.MathUtils.lerp(
      character.model.position.y,
      state.modelBaseY,
      .12
    );
  }

  character.model.updateMatrixWorld(true);
}
