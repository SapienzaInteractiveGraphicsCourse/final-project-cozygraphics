import * as THREE from "three";
import * as GardenBuilders from "./Garden.js";

let ctx=null;
let telescopeHUD=null;
let telescopeMapState=[];
let telescopeKeyBusy=false;
let telescopeHiddenHelpNodes=[];
let telescopeMoonState=[];
let telescopeTitleHUD=null;
let telescopeRotateHUD=null;
let telescopeGuideHideTimer=0;

export const observation={
  stars:null,
  prompt:null,
  vignette:null,
  oldFov:60,
  forward:new THREE.Vector3(),
  eye:new THREE.Vector3(),
  target:new THREE.Vector3(),
  up:new THREE.Vector3(0,1,0),
  yawOffset:0,
  pitchOffset:.10,
  panSpeed:.65
};

function mode(){
  return ctx?.getMode?.();
}

function scene(){
  return ctx?.getScene?.();
}

function camera(){
  return ctx?.getCamera?.();
}

function player(){
  return ctx?.getPlayer?.();
}

function telescopeRoot(){
  return ctx?.getTelescopeRoot?.();
}

function keys(){
  return ctx?.getKeys?.();
}

export function init(options){
  ctx=options;
  initUI();
  window.addEventListener("keydown",handleKey,{capture:true});
}

export function createObservationStars(...args){
  return GardenBuilders.createTelescopeObservationStars(
    ctx.getGardenContext(),
    ...args
  );
}

function setMapHidden(hidden){
  const nodes=[
    document.getElementById("minimap"),
    document.getElementById("miniMap"),
    document.getElementById("map"),
    document.getElementById("mapContainer"),
    document.getElementById("minimapContainer"),
    document.querySelector(".minimap"),
    document.querySelector(".mini-map"),
    document.querySelector(".map-container")
  ].filter(Boolean);

  if(hidden){
    telescopeMapState=[];
    for(const node of [...new Set(nodes)]){
      telescopeMapState.push({
        node,
        display:node.style.display,
        visibility:node.style.visibility
      });
      node.style.display="none";
      node.style.visibility="hidden";
    }
  }else{
    for(const s of telescopeMapState){
      if(!s?.node) continue;
      s.node.style.display=s.display;
      s.node.style.visibility=s.visibility;
    }
    telescopeMapState=[];
  }
}

function setGenericHelpHidden(hidden){
  const candidates=[
    document.getElementById("controls"),
    document.getElementById("controlsHint"),
    document.getElementById("movementHint"),
    document.getElementById("playerControls"),
    document.getElementById("help"),
    document.getElementById("helpText"),
    document.querySelector(".controls"),
    document.querySelector(".controls-hint"),
    document.querySelector(".movement-hint"),
    document.querySelector(".player-controls"),
    document.querySelector(".help-text")
  ].filter(Boolean);

  document.querySelectorAll("body *").forEach(node=>{
    if(node===telescopeHUD || node.children?.length) return;
    const t=String(node.textContent||"").trim().toUpperCase();
    if(
      t==="WASD" ||
      (t.includes("WASD") && t.length<90) ||
      (t.includes("W A S D") && t.length<90)
    ){
      candidates.push(node);
    }
  });

  const unique=[...new Set(candidates)];

  if(hidden){
    telescopeHiddenHelpNodes=[];
    for(const node of unique){
      telescopeHiddenHelpNodes.push({
        node,
        display:node.style.display,
        visibility:node.style.visibility
      });
      node.style.display="none";
      node.style.visibility="hidden";
    }
  }else{
    for(const s of telescopeHiddenHelpNodes){
      if(!s?.node) continue;
      s.node.style.display=s.display;
      s.node.style.visibility=s.visibility;
    }
    telescopeHiddenHelpNodes=[];
  }
}

function setMoonHidden(hidden){
  const moonNodes=[];
  scene()?.traverse?.(obj=>{
    const n=String(obj?.name||"").toLowerCase();
    if(
      n==="moon" ||
      n.includes("moon_mesh") ||
      n.includes("moonmesh") ||
      n.includes("luna") ||
      n.includes("moon_disc") ||
      n.includes("moon_disk") ||
      n.includes("moon_sprite")
    ){
      moonNodes.push(obj);
    }
  });

  if(hidden){
    telescopeMoonState=[];
    for(const obj of [...new Set(moonNodes)]){
      telescopeMoonState.push({obj,visible:obj.visible});
      obj.visible=false;
    }
  }else{
    for(const s of telescopeMoonState){
      if(s?.obj) s.obj.visible=s.visible;
    }
    telescopeMoonState=[];
  }
}

export function forceMoonInvisible(){
  scene()?.traverse?.(obj=>{
    const n=String(obj?.name||"").toLowerCase();
    const matName=Array.isArray(obj?.material)
      ? obj.material.map(m=>String(m?.name||"").toLowerCase()).join(" ")
      : String(obj?.material?.name||"").toLowerCase();

    if(
      n.includes("moon") ||
      n.includes("luna") ||
      matName.includes("moon") ||
      matName.includes("luna")
    ){
      obj.visible=false;
    }
  });
}

function removeLegacyLabels(){
  const selectors=[
    "#telescopePrompt",
    "#telescopeObservationPrompt",
    "#telescopeInteractionPrompt",
    "#telescopeNearPrompt",
    ".telescope-prompt",
    ".telescope-observation-prompt",
    "[data-telescope-prompt]"
  ];
  for(const sel of selectors){
    document.querySelectorAll(sel).forEach(node=>{
      if(node!==telescopeHUD) node.remove();
    });
  }

  document.querySelectorAll("body *").forEach(node=>{
    if(node===telescopeHUD) return;
    if(node.children?.length) return;
    const t=String(node.textContent||"").trim().toLowerCase();
    if(
      t==="press e to use telescope" ||
      t.includes("guarda nel telescopio") ||
      (t.includes("use telescope") && t.includes("press e"))
    ){
      node.remove();
    }
  });
}

export function initUI(){
  removeLegacyLabels();

  if(!telescopeHUD){
    telescopeHUD=document.createElement("div");
    telescopeHUD.id="telescopeHUD";
    Object.assign(telescopeHUD.style,{
      position:"fixed",
      left:"50%",
      bottom:"112px",
      zIndex:"80",
      transform:"translateX(-50%)",
      display:"none",
      padding:"10px 16px",
      border:"1px solid rgba(255,255,255,.34)",
      borderRadius:"9px",
      background:"rgba(7,10,18,.92)",
      color:"#f2f5ff",
      font:"700 14px Arial,sans-serif",
      letterSpacing:".04em",
      boxShadow:"0 10px 28px rgba(0,0,0,.35)",
      pointerEvents:"none"
    });
    document.body.appendChild(telescopeHUD);
  }

  if(!telescopeTitleHUD){
    telescopeTitleHUD=document.createElement("div");
    telescopeTitleHUD.id="telescopeTitleHUD";
    Object.assign(telescopeTitleHUD.style,{
      position:"fixed",
      left:"50%",
      top:"42px",
      zIndex:"79",
      transform:"translateX(-50%)",
      display:"none",
      color:"rgba(242,245,255,.82)",
      font:"800 11px Arial,sans-serif",
      letterSpacing:".22em",
      textShadow:"0 2px 8px rgba(0,0,0,.72)",
      pointerEvents:"none"
    });
    telescopeTitleHUD.textContent="TELESCOPE";
    document.body.appendChild(telescopeTitleHUD);
  }

  if(!telescopeRotateHUD){
    telescopeRotateHUD=document.createElement("div");
    telescopeRotateHUD.id="telescopeRotateHUD";
    Object.assign(telescopeRotateHUD.style,{
      position:"fixed",
      left:"50%",
      bottom:"178px",
      zIndex:"79",
      transform:"translateX(-50%)",
      display:"none",
      color:"rgba(242,245,255,.88)",
      font:"800 19px Arial,sans-serif",
      letterSpacing:".08em",
      textShadow:"0 2px 8px rgba(0,0,0,.72)",
      pointerEvents:"none",
      whiteSpace:"nowrap",
      transition:"opacity .35s ease"
    });
    telescopeRotateHUD.textContent="←        ROTATE VIEW        →";
    document.body.appendChild(telescopeRotateHUD);
  }

  observation.prompt=telescopeHUD;
}

export function isNear(){
  const tel=telescopeRoot();
  const root=player()?.root;
  if(!tel || !root) return false;
  const dx=tel.position.x-root.position.x;
  const dz=tel.position.z-root.position.z;
  return dx*dx+dz*dz<=25;
}

export function refreshHUD(){
  initUI();
  if(!telescopeHUD || !telescopeTitleHUD || !telescopeRotateHUD) return;

  if(mode()?.active){
    setGenericHelpHidden(true);
    setMoonHidden(true);
    forceMoonInvisible();

    telescopeTitleHUD.style.display="block";
    telescopeHUD.textContent="E  EXIT TELESCOPE";
    telescopeHUD.style.display="block";
    telescopeRotateHUD.style.display="block";

    if(!telescopeGuideHideTimer){
      telescopeRotateHUD.style.opacity="1";
      telescopeGuideHideTimer=window.setTimeout(()=>{
        telescopeGuideHideTimer=0;
        if(mode()?.active && telescopeRotateHUD){
          telescopeRotateHUD.style.opacity=".28";
        }
      },3200);
    }
    return;
  }

  if(telescopeGuideHideTimer){
    clearTimeout(telescopeGuideHideTimer);
    telescopeGuideHideTimer=0;
  }

  telescopeTitleHUD.style.display="none";
  telescopeRotateHUD.style.display="none";
  telescopeRotateHUD.style.opacity="1";

  if(isNear()){
    setGenericHelpHidden(true);
    telescopeHUD.textContent="PRESS E TO USE TELESCOPE";
    telescopeHUD.style.display="block";
  }else{
    setGenericHelpHidden(false);
    setMoonHidden(false);
    telescopeHUD.style.display="none";
  }
}

export function enter(...args){
  setMoonHidden(true);
  setMapHidden(true);

  const result=GardenBuilders.enterTelescopeMode(
    ctx.getGardenContext(),
    ...args
  );

  queueMicrotask(()=>{
    try{
      createObservationStars();
      if(observation.stars){
        observation.stars.visible=true;
      }
      refreshHUD();
    }catch(e){}
  });

  return result;
}

export function exit(){
  const m=mode();
  const cam=camera();
  if(!m?.active || !cam) return;
  m.active=false;
  cam.fov=observation.oldFov||60;
  cam.updateProjectionMatrix();

  if(observation.stars){
    observation.stars.visible=false;
  }
  if(observation.vignette){
    observation.vignette.style.display="none";
  }
  if(observation.prompt){
    observation.prompt.style.display="none";
  }

  setMapHidden(false);
  setGenericHelpHidden(false);
  setMoonHidden(false);

  if(telescopeTitleHUD) telescopeTitleHUD.style.display="none";
  if(telescopeRotateHUD) telescopeRotateHUD.style.display="none";

  ctx?.setCleanCameraReady?.(false);
}

function handleKey(ev){
  if(ev.repeat) return;

  const key=String(ev.key||"").toLowerCase();
  if(key!=="e" && key!=="escape") return;

  const active=!!mode()?.active;
  const near=!active && key==="e" && isNear();
  if(!active && !near) return;

  ev.preventDefault();
  ev.stopPropagation();
  ev.stopImmediatePropagation?.();

  if(telescopeKeyBusy) return;
  telescopeKeyBusy=true;

  requestAnimationFrame(()=>{
    requestAnimationFrame(()=>{
      telescopeKeyBusy=false;
    });
  });

  if(active){
    exit();
    requestAnimationFrame(refreshHUD);
    return;
  }

  if(near){
    setMapHidden(true);
    setGenericHelpHidden(true);
    setMoonHidden(true);
    enter();

    requestAnimationFrame(()=>{
      if(mode()?.active && observation.stars){
        observation.stars.visible=true;
      }
      refreshHUD();
    });
  }
}

export function updateView(...args){
  const k=keys();
  if(!k) return;

  const left=k["arrowleft"];
  const right=k["arrowright"];
  k["arrowleft"]=right;
  k["arrowright"]=left;

  const result=GardenBuilders.updateTelescopeView(
    ctx.getGardenContext(),
    ...args
  );

  k["arrowleft"]=left;
  k["arrowright"]=right;
  return result;
}

export function updatePrompt(){
  refreshHUD();
}
