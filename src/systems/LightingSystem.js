import * as THREE from "three";

export function createGlobalLights(scene){
  const moonLight=new THREE.DirectionalLight(0xbfd3ff,.76);
  moonLight.position.set(0,205,-185);
  moonLight.castShadow=false;
  scene.add(moonLight);

  const ambientFill=new THREE.AmbientLight(0xffffff,.40);
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
    intensity:3.10,
    distance:38,
    decay:1.65,
    position:[
      roomCenterX,
      5.6,
      -12.5
    ],
    baseIntensity:3.10
  });

  const fill=createPointLight(scene,{
    name:"casino_room_fill_light",
    color:0xffd8f2,
    intensity:1.55,
    distance:29,
    decay:1.75,
    position:[
      roomCenterX-7.5,
      3.8,
      -24.0
    ],
    baseIntensity:1.55
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

export function createCameraFillLight(scene){
  const light=createPointLight(scene,{
    name:"camera_player_fill_light",
    color:0xdce8ff,
    intensity:.42,
    distance:13,
    decay:2,
    position:[0,-1000,0],
    baseIntensity:.42
  });
  light.userData.lightingTuningLocked=true;
  return light;
}

export function updateCameraFillLight(light,camera,player){
  if(!light || !camera || !player?.root) return;
  light.position.copy(camera.position).lerp(player.root.position,.42);
  light.position.y+=1.35;
  light.visible=true;
}


// ============================================================================
// GARDEN-ONLY MOON SHADOWS
// One low-cost 512px DirectionalLight shadow map, spatially focused on the
// fenced garden. PointLights keep shadows disabled.
// ============================================================================
export function configureGardenMoonShadows(
  scene,
  renderer,
  moonLight,
  {
    xMin=-71.0,
    xMax=71.0,
    zMin=56.9,
    zMax=161.012,
    mapSize=768
  }={}
){
  if(!scene || !renderer || !moonLight) return null;

  // Shadow map is active from the start, but the Moon shadow camera
  // is focused only on the fenced Garden.
  // All ordinary Garden objects can therefore already cast basic shadows before the player enters.
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate=true;

  moonLight.castShadow=true;
  moonLight.shadow.mapSize.set(mapSize,mapSize);
  moonLight.shadow.bias=-0.00035;
  moonLight.shadow.normalBias=0.025;
  moonLight.shadow.radius=2;

  const centerX=(xMin+xMax)*.5;
  const centerZ=(zMin+zMax)*.5;

  moonLight.target.position.set(centerX,0,centerZ);
  if(!moonLight.target.parent){
    scene.add(moonLight.target);
  }

  // Tight orthographic camera around the garden only.
  const halfWidth=(xMax-xMin)*.5+8;
  const halfDepth=(zMax-zMin)*.5+18;
  const extent=Math.max(halfWidth,halfDepth);

  const cam=moonLight.shadow.camera;
  cam.left=-extent;
  cam.right=extent;
  cam.top=extent;
  cam.bottom=-extent;
  cam.near=25;
  cam.far=520;
  cam.updateProjectionMatrix();

  moonLight.shadow.needsUpdate=true;

  return {
    xMin,xMax,zMin,zMax,mapSize,
    playerShadowActive:false,
    playerShadowFade:0,
    playerFadeDistance:12
  };
}

function hasAncestorNameLike(obj,patterns){
  let node=obj;
  while(node){
    const name=(node.name||"").toLowerCase();
    if(patterns.some(pattern=>name.includes(pattern))){
      return true;
    }
    node=node.parent;
  }
  return false;
}

export function refreshGardenShadowCasters(
  scene,
  player,
  {
    xMin=-71.0,
    xMax=71.0,
    zMin=56.9,
    zMax=161.012
  }={},
  roots=[]
){
  if(!scene) return {casters:0,receivers:0};

  scene.updateMatrixWorld(true);

  let casters=0;
  let receivers=0;
  const visited=new Set();
  const box=new THREE.Box3();
  const size=new THREE.Vector3();

  const playerRoot=
    player?.model ||
    player?.root ||
    player;

  // PURE WHITELIST:
  // Only roots explicitly registered by main.html are touched.
  // No cars, police, NPCs, outside poles or outside-world objects can
  // acquire castShadow through this function.
  for(const root of roots){
    if(!root || root.visible===false) continue;

    root.updateMatrixWorld?.(true);

    root.traverse?.(obj=>{
      if(!obj?.isMesh || obj.visible===false || visited.has(obj)) return;
      visited.add(obj);

      // Player is always excluded from the static whitelist.
      // Its shadow is controlled only by updateGardenShadowZone().
      let node=obj;
      while(node){
        if(node===playerRoot){
          obj.castShadow=false;
          obj.receiveShadow=true;
          return;
        }
        node=node.parent;
      }

      obj.receiveShadow=true;
      receivers++;

      // Large flat floor/grass pieces only receive shadow.
      // All real Garden geometry (trees, fountain, display cases,
      // panels, sculptures, telescope, props, etc.) casts basic shadow.
      box.setFromObject(obj);

      if(!box.isEmpty()){
        box.getSize(size);

        const horizontal=Math.max(size.x,size.z);
        const looksLikeLargeGround=
          size.y<.16 &&
          horizontal>12;

        obj.castShadow=!looksLikeLargeGround;

        if(obj.castShadow){
          casters++;
        }
      }
    });
  }

  return {casters,receivers};
}

function ensurePlayerShadowFadeMaterial(mesh){
  if(!mesh?.isMesh) return null;

  if(
    mesh.customDepthMaterial &&
    mesh.customDepthMaterial.userData?.playerGardenShadowFade
  ){
    return mesh.customDepthMaterial;
  }

  const source=
    Array.isArray(mesh.material)
      ? mesh.material[0]
      : mesh.material;

  const depthMaterial=
    new THREE.MeshDepthMaterial({
      depthPacking:THREE.RGBADepthPacking,
      map:source?.map || null,
      alphaMap:source?.alphaMap || null,
      alphaTest:source?.alphaTest || 0
    });

  depthMaterial.userData.playerGardenShadowFade=true;
  depthMaterial.userData.fadeUniform={value:0};

  depthMaterial.onBeforeCompile=shader=>{
    shader.uniforms.playerGardenShadowFade=
      depthMaterial.userData.fadeUniform;

    shader.fragmentShader=
      `
uniform float playerGardenShadowFade;

float playerGardenShadowHash(vec2 p){
  vec3 p3=fract(vec3(p.xyx)*.1031);
  p3+=dot(p3,p3.yzx+33.33);
  return fract((p3.x+p3.y)*p3.z);
}
`+
      shader.fragmentShader;

    shader.fragmentShader=
      shader.fragmentShader.replace(
        "void main() {",
        `void main() {
  // Progressive coverage: no hard pop at the Garden entrance.
  // A tiny screen-space dither makes the Moon shadow build naturally.
  float fadeNoise=
    playerGardenShadowHash(
      floor(gl_FragCoord.xy * .72)
    );

  float coverage=
    smoothstep(
      0.0,
      1.0,
      playerGardenShadowFade
    );

  if(fadeNoise > coverage){
    discard;
  }`
      );
  };

  depthMaterial.customProgramCacheKey=()=>{
    return "player_garden_shadow_fade_v1";
  };

  mesh.customDepthMaterial=depthMaterial;
  return depthMaterial;
}

function setPlayerGardenShadowFade(player,fade){
  const playerRoot=
    player?.model ||
    player?.root ||
    player;

  const amount=
    THREE.MathUtils.clamp(fade,0,1);

  playerRoot?.traverse?.(obj=>{
    if(!obj?.isMesh) return;

    obj.receiveShadow=true;

    // Absolutely no player shadow before entering the Garden.
    obj.castShadow=amount>.001;

    if(obj.castShadow){
      const depthMaterial=
        ensurePlayerShadowFadeMaterial(obj);

      if(depthMaterial?.userData?.fadeUniform){
        depthMaterial.userData.fadeUniform.value=
          amount;
      }
    }
  });
}


// ============================================================================
// TRUE GARDEN SHADOW ZONE
// Outside the fenced Garden there is no active shadow system at all.
// Inside, the Moon shadow map is enabled and only Garden casters/player are used.
// ============================================================================
export function updateGardenShadowZone(
  scene,
  renderer,
  moonLight,
  player,
  state
){
  if(
    !scene ||
    !renderer ||
    !moonLight ||
    !player?.root ||
    !state
  ){
    return 0;
  }

  const p=player.root.position;

  const inside=
    p.x>=state.xMin &&
    p.x<=state.xMax &&
    p.z>=state.zMin &&
    p.z<=state.zMax;

  let fade=0;

  if(inside){
    // Shadow appears gradually while the player moves deeper into the Garden.
    // At the fence: 0%. The shadow becomes fully visible only after moving deeper inside.
    const depthInside=Math.min(
      p.x-state.xMin,
      state.xMax-p.x,
      p.z-state.zMin,
      state.zMax-p.z
    );

    const rawFade=
      THREE.MathUtils.clamp(
        depthInside/
        (state.playerFadeDistance || 12),
        0,
        1
      );

    // Cubic ease-in/out: softer entrance, natural build-up, no sudden shadow pop.
    fade=
      rawFade*rawFade*
      (3-2*rawFade);
  }

  if(
    Math.abs(
      fade-(state.playerShadowFade||0)
    )>.01
  ){
    state.playerShadowFade=fade;

    setPlayerGardenShadowFade(
      player,
      fade
    );

    moonLight.shadow.needsUpdate=true;
  }

  state.playerShadowActive=
    fade>.001;

  return fade;
}
