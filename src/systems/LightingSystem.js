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


// ============================================================================
// MAIN LIGHTING PROFILE / TUNING CONTROLLER
// Moved out of main.html. No collision logic here.
// ============================================================================
export function createLightingTuningController({
  scene,
  player,
  moonLight,
  ambientFill,
  skyFill,
  fixedLightPool,
  getActiveWorldZone=()=>"",
  buildPanel=true,
  outsideProfile=null,
  casinoProfile=null
}={}){
  const LIGHTING_TUNING={
    ambientEnabled:true,
    hemisphereEnabled:true,
    moonEnabled:true,
    pointEnabled:true,
    ambientIntensity:.40,
    hemisphereIntensity:.62,
    moonIntensity:.45,
    pointIntensityScale:.10,
    pointDistanceScale:2.10,
    pointDecay:2.00,
    poolRadius:58
  };

  const OUTSIDE_LIGHTING_PROFILE=outsideProfile || {
    ambientEnabled:true,
    hemisphereEnabled:true,
    moonEnabled:true,
    pointEnabled:true,
    ambientIntensity:.40,
    hemisphereIntensity:.62,
    moonIntensity:.45,
    pointIntensityScale:.10,
    pointDistanceScale:2.10,
    pointDecay:2.00,
    poolRadius:58
  };

  const CASINO_INTERIOR_LIGHTING={
    active:false,
    normal:null,
    profile:casinoProfile || {
      ambientEnabled:true,
      hemisphereEnabled:true,
      moonEnabled:false,
      pointEnabled:false,
      ambientIntensity:.80,
      hemisphereIntensity:.62,
      moonIntensity:.76,
      pointIntensityScale:1.20,
      pointDistanceScale:2.10,
      pointDecay:2.00,
      poolRadius:58
    }
  };

  const assignValues=(source)=>{
    for(const key of Object.keys(source)){
      LIGHTING_TUNING[key]=source[key];
    }
  };

  const pointSources=()=>{
    const lights=[];
    scene?.traverse?.(obj=>{
      if(!obj?.isPointLight) return;
      if(isPooledLocalLight(obj,fixedLightPool)) return;
      if(obj.userData?.lightingTuningLocked) return;

      if(!obj.userData.pointLightTuningBase){
        obj.userData.pointLightTuningBase={
          intensity:Number(
            obj.userData.baseIntensity ??
            obj.intensity ??
            0
          ),
          distance:Number(obj.distance||0),
          decay:Number(obj.decay||2)
        };
      }
      lights.push(obj);
    });
    return lights;
  };

  const refreshPanel=()=>{
    const read=document.getElementById("pointLightTuningReadout");
    if(!read) return;

    const sourceCount=pointSources().length;
    read.textContent=
      `AMBIENT     ${LIGHTING_TUNING.ambientEnabled ? "ON" : "OFF"}  ${LIGHTING_TUNING.ambientIntensity.toFixed(2)}\n`+
      `HEMISPHERE  ${LIGHTING_TUNING.hemisphereEnabled ? "ON" : "OFF"}  ${LIGHTING_TUNING.hemisphereIntensity.toFixed(2)}\n`+
      `MOON        ${LIGHTING_TUNING.moonEnabled ? "ON" : "OFF"}  ${LIGHTING_TUNING.moonIntensity.toFixed(2)}\n`+
      `POINT       ${LIGHTING_TUNING.pointEnabled ? "ON" : "OFF"}\n`+
      `POINT SOURCES ${sourceCount}\n`+
      `INTENSITY x${LIGHTING_TUNING.pointIntensityScale.toFixed(2)}\n`+
      `DISTANCE  x${LIGHTING_TUNING.pointDistanceScale.toFixed(2)}\n`+
      `DECAY     ${LIGHTING_TUNING.pointDecay.toFixed(2)}\n`+
      `POOL RANGE ${LIGHTING_TUNING.poolRadius.toFixed(0)}\n`+
      `ACTIVE POOL ${fixedLightPool?.renderLights?.length || 0}`;
  };

  const apply=()=>{
    if(!scene || !fixedLightPool) return 0;

    ambientFill.visible=LIGHTING_TUNING.ambientEnabled;
    ambientFill.intensity=
      LIGHTING_TUNING.ambientEnabled
        ? LIGHTING_TUNING.ambientIntensity
        : 0;

    skyFill.visible=LIGHTING_TUNING.hemisphereEnabled;
    skyFill.intensity=
      LIGHTING_TUNING.hemisphereEnabled
        ? LIGHTING_TUNING.hemisphereIntensity
        : 0;

    moonLight.visible=LIGHTING_TUNING.moonEnabled;
    moonLight.intensity=
      LIGHTING_TUNING.moonEnabled
        ? LIGHTING_TUNING.moonIntensity
        : 0;

    const lights=pointSources();

    for(const light of lights){
      const base=light.userData.pointLightTuningBase;
      const tunedIntensity=
        base.intensity*
        LIGHTING_TUNING.pointIntensityScale;

      const intensity=
        LIGHTING_TUNING.pointEnabled
          ? tunedIntensity
          : 0;

      light.userData.baseIntensity=intensity;
      light.intensity=intensity;
      light.visible=LIGHTING_TUNING.pointEnabled;

      light.distance=
        base.distance>0
          ? base.distance*LIGHTING_TUNING.pointDistanceScale
          : 0;

      light.decay=LIGHTING_TUNING.pointDecay;
    }

    for(const pooled of fixedLightPool.renderLights){
      pooled.visible=LIGHTING_TUNING.pointEnabled;
      if(!LIGHTING_TUNING.pointEnabled){
        pooled.intensity=0;
      }
    }

    fixedLightPool.outsideMaxDistanceSq=
      LIGHTING_TUNING.poolRadius*
      LIGHTING_TUNING.poolRadius;

    refreshFixedLightSources(scene,fixedLightPool);
    updateFixedLightPool(player,fixedLightPool);
    refreshPanel();

    return lights.length;
  };

  const setCasinoInteriorLighting=(insideCasino)=>{
    if(insideCasino){
      CASINO_INTERIOR_LIGHTING.active=true;
      assignValues(CASINO_INTERIOR_LIGHTING.profile);
      apply();
      return;
    }

    CASINO_INTERIOR_LIGHTING.active=false;
    CASINO_INTERIOR_LIGHTING.normal=null;
    assignValues(OUTSIDE_LIGHTING_PROFILE);
    apply();
  };

  const reset=()=>{
    if(getActiveWorldZone()==="leftRoom"){
      assignValues(CASINO_INTERIOR_LIGHTING.profile);
    }else{
      assignValues(OUTSIDE_LIGHTING_PROFILE);
    }
    apply();
  };

  const buildTuningPanel=()=>{
    if(!buildPanel) return;
    if(document.getElementById("pointLightTuningPanel")) return;

    const toggle=document.createElement("div");
    toggle.id="pointLightTuningToggle";
    toggle.textContent="LIGHTING";
    Object.assign(toggle.style,{
      position:"fixed",
      right:"18px",
      top:"180px",
      zIndex:"12042",
      padding:"9px 12px",
      border:"1px solid rgba(255,220,130,.42)",
      borderRadius:"8px",
      background:"rgba(28,20,8,.94)",
      color:"#ffe6a6",
      font:"700 11px Arial,sans-serif",
      letterSpacing:".08em",
      cursor:"pointer",
      userSelect:"none"
    });

    const panel=document.createElement("div");
    panel.id="pointLightTuningPanel";
    Object.assign(panel.style,{
      display:"none",
      position:"fixed",
      right:"18px",
      top:"224px",
      zIndex:"12041",
      width:"330px",
      padding:"12px",
      boxSizing:"border-box",
      border:"1px solid rgba(255,220,130,.38)",
      borderRadius:"10px",
      background:"rgba(22,16,8,.97)",
      color:"#fff2c8",
      font:"11px Arial,sans-serif",
      boxShadow:"0 12px 34px rgba(0,0,0,.42)"
    });

    const title=document.createElement("div");
    title.textContent="LIGHTING LIVE TUNER";
    title.style.cssText=
      "font-weight:900;letter-spacing:.10em;color:#ffd978;margin-bottom:8px";

    const info=document.createElement("div");
    info.textContent=
      "Regola Ambient, Hemisphere, Moon e PointLight. Ogni categoria può essere disattivata.";
    info.style.cssText=
      "font-size:10px;opacity:.78;line-height:1.4;margin-bottom:8px";

    const read=document.createElement("pre");
    read.id="pointLightTuningReadout";
    read.style.cssText=
      "margin:0 0 10px;padding:8px;border-radius:6px;background:rgba(255,255,255,.05);font:10px monospace;line-height:1.45;white-space:pre-wrap";

    const controls=document.createElement("div");

    const toggleRows=[
      ["AMBIENT","ambientEnabled"],
      ["HEMISPHERE","hemisphereEnabled"],
      ["MOON","moonEnabled"],
      ["POINT LIGHTS","pointEnabled"]
    ];

    for(const [label,key] of toggleRows){
      const row=document.createElement("div");
      row.style.cssText=
        "display:grid;grid-template-columns:1fr 92px;gap:8px;align-items:center;margin:6px 0";

      const labelNode=document.createElement("span");
      labelNode.textContent=label;

      const btn=document.createElement("button");

      const refreshToggle=()=>{
        btn.textContent=
          LIGHTING_TUNING[key]
            ? "ON"
            : "OFF";
        btn.style.background=
          LIGHTING_TUNING[key]
            ? "#3d5c16"
            : "#5b1919";
      };

      btn.style.cssText=
        "min-height:30px;border:1px solid rgba(255,220,130,.28);border-radius:6px;color:#fff1bf;font-weight:900;cursor:pointer";

      btn.addEventListener("click",()=>{
        LIGHTING_TUNING[key]=!LIGHTING_TUNING[key];
        refreshToggle();
        apply();
      });

      refreshToggle();
      row.append(labelNode,btn);
      controls.appendChild(row);
    }

    const rows=[
      ["AMBIENT","ambientIntensity",.05,0,2],
      ["HEMISPHERE","hemisphereIntensity",.05,0,2],
      ["MOON","moonIntensity",.05,0,2],
      ["POINT INTENSITY","pointIntensityScale",.05,0,3],
      ["POINT DISTANCE","pointDistanceScale",.05,.1,4],
      ["POINT DECAY","pointDecay",.05,.1,4],
      ["POOL RANGE","poolRadius",1,5,150]
    ];

    for(const [label,key,step,min,max] of rows){
      const row=document.createElement("div");
      row.style.cssText=
        "display:grid;grid-template-columns:1fr 42px 42px;gap:6px;align-items:center;margin:6px 0";

      const labelNode=document.createElement("span");
      labelNode.textContent=label;

      const minus=document.createElement("button");
      minus.textContent="−";

      const plus=document.createElement("button");
      plus.textContent="+";

      for(const btn of [minus,plus]){
        btn.style.cssText=
          "min-height:30px;border:1px solid rgba(255,220,130,.28);border-radius:6px;background:#46320c;color:#fff1bf;font-weight:900;cursor:pointer";
      }

      const change=(dir)=>{
        LIGHTING_TUNING[key]=
          THREE.MathUtils.clamp(
            LIGHTING_TUNING[key]+step*dir,
            min,
            max
          );
        apply();
      };

      minus.addEventListener("click",()=>change(-1));
      plus.addEventListener("click",()=>change(1));

      row.append(labelNode,minus,plus);
      controls.appendChild(row);
    }

    const resetButton=document.createElement("button");
    resetButton.textContent="RESET LIGHTING";
    resetButton.style.cssText=
      "width:100%;min-height:32px;margin-top:8px;border:1px solid rgba(255,220,130,.35);border-radius:6px;background:#5b3d08;color:#fff3c8;font-weight:900;cursor:pointer";
    resetButton.addEventListener("click",reset);

    panel.append(
      title,
      info,
      read,
      controls,
      resetButton
    );

    document.body.append(toggle,panel);

    toggle.addEventListener("click",()=>{
      panel.style.display=
        panel.style.display==="block"
          ? "none"
          : "block";

      if(panel.style.display==="block"){
        apply();
      }
    });

    refreshPanel();
  };

  buildTuningPanel();
  apply();

  return {
    state:LIGHTING_TUNING,
    outsideProfile:OUTSIDE_LIGHTING_PROFILE,
    casinoInterior:CASINO_INTERIOR_LIGHTING,
    apply,
    reset,
    pointSources,
    refreshPanel,
    setCasinoInteriorLighting
  };
}


export function disableOldLocalLightsKeepMoon(scene){
  scene?.traverse?.(obj=>{
    if(!obj?.isLight) return;

    const name=(obj.name||"").toLowerCase();

    if(name.includes("moon") || name.includes("lunar")) return;
    if(obj.parent?.name==="simple_light_pole") return;

    if(obj.type==="PointLight" || obj.type==="SpotLight"){
      obj.visible=false;
    }
  });
}


// ============================================================================
// PROCEDURAL GARDEN TREE SHADOW GEOMETRY
// Collision data stays in main.html; only the visual shadow geometry lives here.
// ============================================================================
export function createProceduralGardenTreeShadowSystem(
  scene,
  treeColliders,
  {
    offsetX=-.60,
    offsetZ=2.58,
    opacity=.46
  }={}
){
  const state={
    group:new THREE.Group(),
    texture:null,
    material:null
  };

  state.group.name="procedural_garden_tree_branch_shadows";
  state.group.position.set(offsetX,0,offsetZ);
  scene.add(state.group);

  const seededRandom=(seed)=>{
    let s=(seed>>>0)||1;
    return ()=>{
      s=(s*1664525+1013904223)>>>0;
      return s/4294967296;
    };
  };

  const makeTexture=()=>{
    if(state.texture) return state.texture;

    const canvas=document.createElement("canvas");
    canvas.width=512;
    canvas.height=512;

    const ctx=canvas.getContext("2d");
    const rnd=seededRandom(918273);

    ctx.clearRect(0,0,512,512);

    const rootX=256;
    const rootY=486;

    ctx.save();
    ctx.filter="blur(22px)";
    ctx.globalAlpha=.42;
    ctx.strokeStyle="#000";
    ctx.fillStyle="#000";
    ctx.lineCap="round";
    ctx.lineJoin="round";

    ctx.globalAlpha=.52;
    ctx.beginPath();
    ctx.moveTo(rootX-16,rootY);
    ctx.lineTo(rootX-11,390);
    ctx.lineTo(rootX-5,306);
    ctx.lineTo(rootX+8,306);
    ctx.lineTo(rootX+13,390);
    ctx.lineTo(rootX+17,rootY);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha=.42;

    const branchDefs=[
      [-1,370,105,78],
      [ 1,360,115,92],
      [-1,340,135,115],
      [ 1,326,145,120],
      [-1,304,150,130],
      [ 1,286,142,134],
      [-1,267,118,122],
      [ 1,248,112,114]
    ];

    for(let i=0;i<branchDefs.length;i++){
      const [side,sy,reachX,reachY]=branchDefs[i];
      const sx=rootX+(i%3-1)*4;
      const ex=sx+side*reachX;
      const ey=sy-reachY;

      ctx.lineWidth=13-i*.7;
      ctx.beginPath();
      ctx.moveTo(sx,sy);
      ctx.quadraticCurveTo(
        sx+side*reachX*.48,
        sy-reachY*.36,
        ex,ey
      );
      ctx.stroke();
    }

    const masses=[
      [135,210,94,68],
      [220,155,110,84],
      [315,165,112,88],
      [402,228,86,68],
      [112,300,78,60],
      [225,290,118,82],
      [355,300,104,74]
    ];

    for(const [cx,cy,rx,ry] of masses){
      const points=18;
      ctx.beginPath();

      for(let p=0;p<points;p++){
        const a=(p/points)*Math.PI*2;
        const jag=.72+rnd()*.38;

        const x=
          cx+
          Math.cos(a)*rx*jag+
          (rnd()-.5)*10;

        const y=
          cy+
          Math.sin(a)*ry*jag+
          (rnd()-.5)*9;

        if(p===0) ctx.moveTo(x,y);
        else ctx.lineTo(x,y);
      }

      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();

    ctx.save();
    ctx.filter="blur(10px)";
    ctx.globalAlpha=.26;
    ctx.strokeStyle="#000";
    ctx.fillStyle="#000";
    ctx.lineCap="round";
    ctx.lineJoin="round";

    ctx.globalAlpha=.34;
    ctx.beginPath();
    ctx.moveTo(rootX-9,rootY);
    ctx.lineTo(rootX-7,394);
    ctx.lineTo(rootX-2,320);
    ctx.lineTo(rootX+5,320);
    ctx.lineTo(rootX+8,394);
    ctx.lineTo(rootX+10,rootY);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha=.26;

    for(let i=0;i<7;i++){
      const side=i%2===0?-1:1;
      const sy=370-i*18;
      const ex=rootX+side*(74+i*10);
      const ey=sy-(54+i*9);

      ctx.lineWidth=6.5-i*.35;
      ctx.beginPath();
      ctx.moveTo(rootX,sy);
      ctx.quadraticCurveTo(
        rootX+side*(34+i*5),
        sy-(22+i*4),
        ex,ey
      );
      ctx.stroke();
    }

    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation="destination-out";
    ctx.filter="blur(7px)";
    ctx.globalAlpha=.72;

    for(let i=0;i<22;i++){
      const cx=100+rnd()*315;
      const cy=125+rnd()*210;
      const w=10+rnd()*20;
      const h=7+rnd()*15;

      ctx.beginPath();
      ctx.moveTo(cx-w,cy);
      ctx.lineTo(cx-w*.25,cy-h);
      ctx.lineTo(cx+w,cy-h*.18);
      ctx.lineTo(cx+w*.32,cy+h);
      ctx.lineTo(cx-w*.62,cy+h*.42);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();

    const tex=new THREE.CanvasTexture(canvas);
    tex.colorSpace=THREE.SRGBColorSpace;
    tex.needsUpdate=true;

    state.texture=tex;
    return tex;
  };

  const rebuild=()=>{
    state.group.clear();

    const tex=makeTexture();

    if(!state.material){
      state.material=
        new THREE.MeshBasicMaterial({
          map:tex,
          color:0x000000,
          transparent:true,
          opacity,
          depthWrite:false,
          depthTest:true,
          alphaTest:.006,
          side:THREE.DoubleSide,
          toneMapped:false,
          polygonOffset:true,
          polygonOffsetFactor:-1,
          polygonOffsetUnits:-1
        });
    }

    const dirX=.08;
    const dirZ=.9968;
    const baseAngle=Math.atan2(dirZ,dirX);

    for(let i=0;i<(treeColliders?.length || 0);i++){
      const item=treeColliders[i];
      const r=Math.max(.32,item.radius);

      const width=
        THREE.MathUtils.clamp(
          5.4+r*3.8,
          6.4,
          10.0
        );

      const length=
        THREE.MathUtils.clamp(
          8.8+r*5.2,
          10.2,
          15.2
        );

      const travelAngle=
        baseAngle+
        THREE.MathUtils.degToRad(
          ((i%3)-1)*1.3
        );

      const silhouetteAngle=
        travelAngle+
        Math.PI;

      const reach=length*.31;

      const shadow=
        new THREE.Mesh(
          new THREE.PlaneGeometry(1,1),
          state.material
        );

      shadow.name=
        `${item.name}_soft_branch_leaf_shadow`;

      shadow.rotation.x=-Math.PI/2;
      shadow.rotation.z=
        silhouetteAngle-
        Math.PI/2;

      shadow.position.set(
        item.x+Math.cos(travelAngle)*reach,
        .070,
        item.z+Math.sin(travelAngle)*reach
      );

      shadow.scale.set(width,length,1);
      shadow.renderOrder=8;
      shadow.frustumCulled=true;

      state.group.add(shadow);
    }

    state.group.updateMatrixWorld(true);
    return state.group.children.length;
  };

  rebuild();

  return {
    group:state.group,
    rebuild
  };
}


// ============================================================================
// PLAYER LOW-COST GARDEN CONTACT SHADOW
// Visual geometry only.
// ============================================================================
export function createPlayerGardenBlobShadowSystem(
  scene,
  {
    xMin=-71.0,
    xMax=71.0,
    zMin=56.900,
    zMax=161.012
  }={}
){
  const state={
    mesh:null,
    opacity:0
  };

  const ensureMesh=()=>{
    if(state.mesh) return state.mesh;

    const canvas=document.createElement("canvas");
    canvas.width=64;
    canvas.height=64;

    const ctx=canvas.getContext("2d");
    const gradient=
      ctx.createRadialGradient(
        32,32,3,
        32,32,30
      );

    gradient.addColorStop(0,"rgba(0,0,0,.82)");
    gradient.addColorStop(.42,"rgba(0,0,0,.50)");
    gradient.addColorStop(.75,"rgba(0,0,0,.16)");
    gradient.addColorStop(1,"rgba(0,0,0,0)");

    ctx.fillStyle=gradient;
    ctx.fillRect(0,0,64,64);

    const texture=
      new THREE.CanvasTexture(canvas);

    texture.needsUpdate=true;

    const material=
      new THREE.MeshBasicMaterial({
        map:texture,
        transparent:true,
        opacity:0,
        depthWrite:false,
        depthTest:true,
        color:0x000000,
        side:THREE.DoubleSide
      });

    const mesh=
      new THREE.Mesh(
        new THREE.PlaneGeometry(1.45,2.45),
        material
      );

    mesh.name="player_garden_contact_shadow_low_cost";
    mesh.rotation.x=-Math.PI/2;
    mesh.rotation.z=
      THREE.MathUtils.degToRad(-18);

    mesh.position.y=.035;
    mesh.renderOrder=3;
    mesh.frustumCulled=true;
    mesh.castShadow=false;
    mesh.receiveShadow=false;
    mesh.visible=false;

    scene.add(mesh);
    state.mesh=mesh;

    return mesh;
  };

  const update=(player,dt)=>{
    const mesh=ensureMesh();

    if(!player?.root){
      mesh.visible=false;
      return;
    }

    const p=player.root.position;

    const inside=
      p.x>xMin &&
      p.x<xMax &&
      p.z>zMin &&
      p.z<zMax;

    const targetOpacity=
      inside ? .34 : 0;

    const speed=
      inside ? 7.5 : 9.0;

    const blend=
      1-
      Math.exp(
        -speed*
        Math.min(
          .05,
          Math.max(
            .001,
            dt||.016
          )
        )
      );

    state.opacity=
      THREE.MathUtils.lerp(
        state.opacity,
        targetOpacity,
        blend
      );

    mesh.visible=
      state.opacity>.008;

    mesh.material.opacity=
      state.opacity;

    if(!mesh.visible) return;

    mesh.position.set(
      p.x+.24,
      .035,
      p.z+.38
    );

    mesh.rotation.z=
      -player.root.rotation.y+
      THREE.MathUtils.degToRad(-18);
  };

  return {
    state,
    ensureMesh,
    update
  };
}

