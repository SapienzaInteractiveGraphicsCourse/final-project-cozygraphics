// CollisionSystem PASS1 FIXED - named exports verified.
// CollisionSystem.js
// Shared collision data and reusable collision geometry helpers.
// Casino-specific collision builders are intentionally kept in main.html for now.

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
  if(collider?.type==="cylinder"){
    const dx=cx-collider.cx;
    const dz=cz-collider.cz;
    const rr=r+(collider.radius||collider.hx||.25);
    return dx*dx+dz*dz < rr*rr;
  }
  return circleBoxOverlap(THREE,cx,cz,r,collider);
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
