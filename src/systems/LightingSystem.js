import * as THREE from "three";

export function createGlobalLights(scene){
  const moonLight=new THREE.DirectionalLight(0xbfd3ff,.76);
  moonLight.position.set(0,205,-185);
  moonLight.castShadow=false;
  scene.add(moonLight);

  const ambientFill=new THREE.AmbientLight(0xffffff,.60);
  scene.add(ambientFill);

  const skyFill=new THREE.HemisphereLight(0xcfe3ff,0x665247,.62);
  scene.add(skyFill);

  return {
    moonLight,
    ambientFill,
    skyFill
  };
}

export function createFixedLightPool(scene,{
  count=3,
  color=0xffe2b8,
  distance=18,
  decay=2,
  sourceRefreshStep=3.0,
  updateStep=.25,
  outsideMaxDistance=58
}={}){
  const pool={
    renderLights:[],
    sources:[],
    tmp:new THREE.Vector3(),
    refreshAccumulator:0,
    updateAccumulator:0,
    sourceRefreshStep,
    updateStep,
    outsideMaxDistanceSq:outsideMaxDistance*outsideMaxDistance
  };

  for(let i=0;i<count;i++){
    const pooled=new THREE.PointLight(
      color,
      0,
      distance,
      decay
    );

    pooled.name=`fixed_local_light_${i+1}`;
    pooled.castShadow=false;
    pooled.visible=true;
    pooled.position.set(0,-1000,0);

    scene.add(pooled);
    pool.renderLights.push(pooled);
  }

  return pool;
}

export function isPooledLocalLight(light,pool){
  return !!pool?.renderLights?.includes(light);
}

export function refreshFixedLightSources(scene,pool){
  if(!scene || !pool) return;

  pool.sources.length=0;
  scene.updateMatrixWorld(true);

  scene.traverse(obj=>{
    if(
      !obj?.isPointLight ||
      isPooledLocalLight(obj,pool)
    ){
      return;
    }

    const baseIntensity=Number(
      obj.userData?.baseIntensity ??
      obj.intensity ??
      0
    );

    if(baseIntensity<=0){
      obj.visible=false;
      obj.castShadow=false;
      return;
    }

    obj.getWorldPosition(pool.tmp);

    pool.sources.push({
      light:obj,
      x:pool.tmp.x,
      y:pool.tmp.y,
      z:pool.tmp.z,
      color:obj.color?.getHex?.() ?? 0xffffff,
      intensity:baseIntensity,
      distance:Math.max(
        8,
        Math.min(30,obj.distance||16)
      ),
      decay:obj.decay||2
    });

    obj.visible=false;
    obj.castShadow=false;
  });
}

export function updateFixedLightPool(player,pool){
  if(!player?.root || !pool) return;

  const px=player.root.position.x;
  const py=player.root.position.y;
  const pz=player.root.position.z;

  const candidates=[];

  for(const src of pool.sources){
    const dx=src.x-px;
    const dy=src.y-py;
    const dz=src.z-pz;
    const d2=dx*dx+dy*dy+dz*dz;

    if(d2>pool.outsideMaxDistanceSq) continue;

    let insertAt=candidates.length;

    for(let i=0;i<candidates.length;i++){
      if(d2<candidates[i].d2){
        insertAt=i;
        break;
      }
    }

    candidates.splice(insertAt,0,{src,d2});

    if(candidates.length>pool.renderLights.length){
      candidates.pop();
    }
  }

  for(let i=0;i<pool.renderLights.length;i++){
    const pooled=pool.renderLights[i];
    const candidate=candidates[i];

    if(!candidate){
      pooled.intensity=0;
      pooled.position.set(0,-1000,0);
      continue;
    }

    const src=candidate.src;

    pooled.position.set(
      src.x,
      src.y,
      src.z
    );

    pooled.color.setHex(src.color);
    pooled.intensity=src.intensity;
    pooled.distance=src.distance;
    pooled.decay=src.decay;
  }
}

export function addLampGlow(
  parent,
  localPosition,
  intensity=.7,
  distance=9,
  color=0xffe3ad
){
  const glow=new THREE.PointLight(
    color,
    intensity,
    distance,
    2
  );

  glow.position.copy(localPosition);
  glow.castShadow=false;
  glow.userData.baseIntensity=intensity;

  parent.add(glow);

  return glow;
}


export function createPointLight(scene,{
  name="",
  color=0xffffff,
  intensity=1,
  distance=0,
  decay=2,
  position=[0,0,0],
  castShadow=false,
  baseIntensity=null
}={}){
  const light=new THREE.PointLight(
    color,
    intensity,
    distance,
    decay
  );

  if(name) light.name=name;

  light.position.set(
    Number(position[0])||0,
    Number(position[1])||0,
    Number(position[2])||0
  );

  light.castShadow=!!castShadow;

  if(baseIntensity!==null){
    light.userData.baseIntensity=
      Number(baseIntensity)||0;
  }

  scene.add(light);

  return light;
}

export function createZeroPointLightPair(scene,{
  color=0xffd6a0,
  decay=1.8,
  leftPosition=[0,0,0],
  rightPosition=[0,0,0]
}={}){
  const left=createPointLight(scene,{
    color,
    intensity:0,
    distance:0,
    decay,
    position:leftPosition
  });

  const right=createPointLight(scene,{
    color,
    intensity:0,
    distance:0,
    decay,
    position:rightPosition
  });

  return {left,right};
}

export function refreshPerformanceLightCache(
  scene,
  perfRuntime,
  pool
){
  if(!scene || !perfRuntime) return;

  perfRuntime.pointLights.length=0;

  scene.traverse(obj=>{
    if(
      obj?.isPointLight &&
      !isPooledLocalLight(obj,pool)
    ){
      perfRuntime.pointLights.push(obj);
    }
  });

  refreshFixedLightSources(scene,pool);
}


export function createCasinoRoomLighting(
  scene,
  roomCenterX
){
  const key=createPointLight(scene,{
    name:"casino_room_key_light",
    color:0xc7d8ff,
    intensity:2.15,
    distance:34,
    decay:1.75,
    position:[
      roomCenterX,
      5.6,
      -12.5
    ],
    baseIntensity:2.15
  });

  const fill=createPointLight(scene,{
    name:"casino_room_fill_light",
    color:0xffd8f2,
    intensity:.95,
    distance:24,
    decay:1.9,
    position:[
      roomCenterX-7.5,
      3.8,
      -24.0
    ],
    baseIntensity:.95
  });

  // These two lights form a dedicated interior setup and should not
  // be reduced by the global exterior PointLight tuning multiplier.
  key.userData.lightingTuningLocked=true;
  fill.userData.lightingTuningLocked=true;

  return {
    key,
    fill
  };
}
