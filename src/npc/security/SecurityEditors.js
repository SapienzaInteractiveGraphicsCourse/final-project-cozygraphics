// SecurityEditors.js
// Security-facing editor/state/UI helpers extracted from core/main.js.
// Gameplay AI/turn logic stays in main; this module only owns the editor/state layer.

export function createSecurityEditors(deps){
  const {
    THREE,
    GLOBAL_DIALOGUE_LOCK,
    QUEST,
    SECURITY_POST_CASE_HOME_LOCK,
    SECURITY_TALK2,
    SECURITY_UNIFIED_TALK_PANEL,
    STOREKEEPER_FINAL,
    getBones,
    getEditableThief,
    getRest,
    keys,
    normalizeAngle,
    player,
    questAdvanceDialogue,
    questGetPolice,
    smooth01,
    smoothBoneTo
  }=deps;

function getSecurityUnifiedTalkTarget(){

  initSecurityOldTalkPanelTargets(questGetPolice());
  return {
    mode:"TALK",
    source:SECURITY_OLD_TALK_PANEL.target,
    degrees:false
  };
}

function securityUnifiedGetDeg(obj,key,axis){
  const v=obj?.[key]?.[axis] ?? 0;
  return THREE.MathUtils.radToDeg(v);
}

function refreshSecurityUnifiedTalkPanel(){
  const panel=SECURITY_UNIFIED_TALK_PANEL.panel;
  if(!panel) return;

  const info=getSecurityUnifiedTalkTarget();
  const mode=info.mode;
  const src=info.source;

  if(SECURITY_UNIFIED_TALK_PANEL.mode!==mode){
    SECURITY_UNIFIED_TALK_PANEL.mode=mode;

    for(const [key,axes] of Object.entries(SECURITY_UNIFIED_TALK_PANEL.controls)){
      for(const axis of ["x","y","z"]){
        const control=axes[axis];
        if(!control) continue;

        const deg=securityUnifiedGetDeg(src,key,axis);
        control.slider.value=String(Math.round(deg*10)/10);
        control.value.textContent=`${Number(control.slider.value).toFixed(1)}°`;
      }
    }
  }

  const lines=[
    `SECURITY LIVE TALK EDITOR · TALK`,
    "Security TALK · used in every Security conversation"
  ];

  for(const key of [
    "leftArm","leftForeArm","leftHand",
    "rightArm","rightForeArm","rightHand"
  ]){
    lines.push(
      `${key}: x ${securityUnifiedGetDeg(src,key,"x").toFixed(1)}° · `+
      `y ${securityUnifiedGetDeg(src,key,"y").toFixed(1)}° · `+
      `z ${securityUnifiedGetDeg(src,key,"z").toFixed(1)}°`
    );
  }

  SECURITY_UNIFIED_TALK_PANEL.readout.textContent=lines.join("\n");
}


function hideAllSecurityContextPanels(){
  if(SECURITY_OLD_TALK_PANEL?.panel){
    SECURITY_OLD_TALK_PANEL.panel.style.setProperty("display","none","important");
  }
  if(SECURITY_FINAL_POSE_EDITOR?.panel){
    SECURITY_FINAL_POSE_EDITOR.panel.style.setProperty("display","none","important");
  }
  if(SECURITY_TALK2?.panel){
    SECURITY_TALK2.panel.style.setProperty("display","none","important");
  }
}

const FINAL_SECURITY_DIALOGUE_FACING={
  mode:"player",
  active:false,
  transitionStart:0,
  initialized:false,
  fromRootYaw:0,
  fromNeckY:0,
  fromHeadY:0,
  fromSpineY:0,
  returnComplete:false,
  pendingConclude:false
};

function setFinalSecurityDialogueFacing(mode){
  const state=FINAL_SECURITY_DIALOGUE_FACING;

  state.mode=mode;
  state.active=true;
  state.transitionStart=performance.now();
  state.returnComplete=false;
  state.pendingConclude=false;

  const security=questGetPolice?.();

  if(security?.root){
    const b=getBones(security);
    const neckRest=getRest(security,b.neck);
    const headRest=getRest(security,b.head);
    const spineRest=getRest(security,b.spine);

    state.fromRootYaw=security.root.rotation.y;
    state.fromNeckY=b.neck?.rotation?.y ?? neckRest?.y ?? 0;
    state.fromHeadY=b.head?.rotation?.y ?? headRest?.y ?? 0;
    state.fromSpineY=b.spine?.rotation?.y ?? spineRest?.y ?? 0;
    state.initialized=true;
  }else{
    state.initialized=false;
  }
}

function updateFinalSecurityDialogueFacing(){
  if(
    !FINAL_SECURITY_DIALOGUE_FACING.active ||
    !QUEST.dialogueActive ||
    String(QUEST.dialogueSpeaker||"").toUpperCase()!=="SECURITY"
  ){
    return;
  }

  const security=questGetPolice?.();
  const thief=getEditableThief?.();

  if(!security?.root) return;

  let target=null;

  if(
    FINAL_SECURITY_DIALOGUE_FACING.mode==="thief" &&
    thief?.root?.visible
  ){
    target=thief.root;
  }else if(player?.root){
    target=player.root;
  }

  if(!target) return;

  const dx=target.position.x-security.root.position.x;
  const dz=target.position.z-security.root.position.z;

  if(dx*dx+dz*dz<.0001) return;

  const targetYaw=Math.atan2(dx,dz);
  const b=getBones(security);

  const neckRest=getRest(security,b.neck);
  const headRest=getRest(security,b.head);
  const spineRest=getRest(security,b.spine);

  const state=FINAL_SECURITY_DIALOGUE_FACING;

  if(!state.initialized){
    state.initialized=true;
    state.transitionStart=performance.now();
    state.fromRootYaw=security.root.rotation.y;
    state.fromNeckY=b.neck?.rotation?.y ?? neckRest?.y ?? 0;
    state.fromHeadY=b.head?.rotation?.y ?? headRest?.y ?? 0;
    state.fromSpineY=b.spine?.rotation?.y ?? spineRest?.y ?? 0;
  }

  const elapsed=(performance.now()-state.transitionStart)/1000;

  const returningToPlayer=
    FINAL_SECURITY_DIALOGUE_FACING.mode==="player";

  const smoother01=(v)=>{
    const t=THREE.MathUtils.clamp(v,0,1);
    return t*t*t*(t*(t*6-15)+10);
  };

  const headT=returningToPlayer
    ? smoother01(elapsed/1.65)
    : smooth01(THREE.MathUtils.clamp(elapsed/1.55,0,1));

  const neckT=returningToPlayer
    ? smoother01((elapsed-.02)/1.85)
    : smooth01(THREE.MathUtils.clamp((elapsed-.05)/1.35,0,1));

  const spineT=returningToPlayer
    ? smoother01((elapsed-.07)/2.00)
    : smooth01(THREE.MathUtils.clamp((elapsed-.10)/1.30,0,1));

  const rootT=returningToPlayer
    ? smoother01((elapsed-.10)/2.15)
    : smooth01(THREE.MathUtils.clamp((elapsed-.14)/1.45,0,1));

  const fullRootDelta=
    normalizeAngle(targetYaw-state.fromRootYaw);

  const rootAmount=
    FINAL_SECURITY_DIALOGUE_FACING.mode==="thief"
      ? .42
      : 1.00;

  const desiredRootYaw=
    state.fromRootYaw+
    fullRootDelta*rootAmount;

  const newRootYaw=
    state.fromRootYaw+
    normalizeAngle(desiredRootYaw-state.fromRootYaw)*rootT;

  security.root.rotation.y=newRootYaw;

  const localDelta=normalizeAngle(
    targetYaw-newRootYaw
  );

  const clamped=THREE.MathUtils.clamp(
    localDelta,
    -.26,
    .26
  );

  if(b.spine && spineRest){
    const targetSpineY=
      spineRest.y+
      clamped*.10*spineT;

    b.spine.rotation.y=THREE.MathUtils.lerp(
      state.fromSpineY,
      targetSpineY,
      spineT*.68
    );
  }

  if(b.neck && neckRest){
    const targetNeckY=
      neckRest.y+
      clamped*.30*neckT;

    b.neck.rotation.y=THREE.MathUtils.lerp(
      state.fromNeckY,
      targetNeckY,
      neckT*.78
    );
  }

  if(b.head && headRest){
    const targetHeadY=
      headRest.y+
      clamped*.34*headT;

    b.head.rotation.y=THREE.MathUtils.lerp(
      state.fromHeadY,
      targetHeadY,
      headT*.75
    );
  }

  if(
    QUEST.dialogueActive &&
    String(QUEST.dialogueSpeaker||"").toUpperCase()==="SECURITY" &&
    b.head &&
    headRest
  ){
    const talkNow=performance.now();

    const lookingAtThief=
      FINAL_SECURITY_DIALOGUE_FACING.active &&
      FINAL_SECURITY_DIALOGUE_FACING.mode==="thief";

    const talkNod=lookingAtThief
      ? Math.sin(talkNow*.0027)*.011
      : Math.sin(talkNow*.0064)*.028;

    const currentYaw=b.head.rotation.y;
    const currentRoll=b.head.rotation.z;

    b.head.rotation.x=THREE.MathUtils.lerp(
      b.head.rotation.x,
      headRest.x+talkNod,
      lookingAtThief ? .055 : .10
    );

    b.head.rotation.y=currentYaw;
    b.head.rotation.z=currentRoll;
  }

  security.root.updateMatrixWorld(true);

  if(returningToPlayer){
    const finished=
      headT>=.999 &&
      neckT>=.999 &&
      spineT>=.999 &&
      rootT>=.999;

    if(finished && !state.returnComplete){
      state.returnComplete=true;

      if(state.pendingConclude){
        state.pendingConclude=false;
        requestAnimationFrame(()=>{
          if(QUEST.dialogueActive){
            questAdvanceDialogue();
          }
        });
      }
    }
  }
}

const FINAL_ARREST_FLOW={
  active:false,
  finished:false
};

const SECURITY_POSE_EDITOR={
  panel:null,
  readout:null,
  bones:{},
  rest:{},
  enabled:true,
  wasTalking:false,
  returnActive:false,
  returnStart:0,
  returnDuration:1600,
  returnFrom:{},
  rightNeutralAfterTalk:false,
  rightReturnActive:false,
  rightReturnStart:0,
  rightReturnDuration:1300,
  rightReturnFrom:{},
  offsets:{
    leftShoulder:{x:0,y:0,z:0},
    leftArm:{x:0,y:10,z:0},
    leftForeArm:{x:0,y:22,z:7},
    leftHand:{x:0,y:0,z:0},
    rightShoulder:{x:0,y:0,z:0},
    rightArm:{x:14.5,y:0,z:0},
    rightForeArm:{x:0,y:0,z:0},
    rightHand:{x:0,y:0,z:0}
  },
  fingerOffsets:{
    left_thumb_1:{x:-11,y:0,z:-21},
    left_thumb_2:{x:9,y:0,z:0}
  }
};

const SECURITY_FINAL_POSE_EDITOR={
  panel:null,
  readout:null,
  transitionActive:false,
  transitionStart:0,
  transitionDuration:1600,
  transitionFrom:{},
  body:{
    leftShoulder:{x:0,y:0,z:0},
    leftArm:{x:0,y:10,z:0},
    leftForeArm:{x:0,y:22,z:7},
    leftHand:{x:0,y:0,z:0},

    rightShoulder:{x:0,y:0,z:0},
    rightArm:{x:0,y:-10,z:0},
    rightForeArm:{x:0,y:-22,z:-7},
    rightHand:{x:0,y:0,z:0}
  },
  fingers:{}
};

function securityMirrorLeftFinalToRight(){
  const security=questGetPolice();
  if(!security?.root) return;

  if(!SECURITY_POSE_EDITOR.bones.leftArm){
    cacheSecurityPoseEditorBones();
  }

  const b=SECURITY_FINAL_POSE_EDITOR.body;
  const bones=SECURITY_POSE_EDITOR.bones;
  const rest=SECURITY_POSE_EDITOR.rest;

  const pairs=[
    ["leftShoulder","rightShoulder"],
    ["leftArm","rightArm"],
    ["leftForeArm","rightForeArm"],
    ["leftHand","rightHand"]
  ];

  const touched=new Set();
  for(const [l,r] of pairs){
    if(bones[l]) touched.add(bones[l]);
    if(bones[r]) touched.add(bones[r]);
  }

  const saved=[];
  for(const bone of touched){
    saved.push({
      bone,
      quat:bone.quaternion.clone()
    });
  }

  try{

    for(const [leftKey] of pairs){
      const bone=bones[leftKey];
      const r=rest[leftKey];
      const o=b[leftKey];
      if(!bone || !r || !o) continue;

      bone.rotation.set(
        r.x+THREE.MathUtils.degToRad(o.x||0),
        r.y+THREE.MathUtils.degToRad(o.y||0),
        r.z+THREE.MathUtils.degToRad(o.z||0),
        bone.rotation.order
      );
      bone.updateMatrix();
    }

    security.root.updateMatrixWorld(true);

    const rootRot=new THREE.Matrix4().extractRotation(security.root.matrixWorld);
    const invRootRot=rootRot.clone().invert();

    const reflectX=new THREE.Matrix4().makeScale(-1,1,1);

    const wrapPi=(a)=>{
      a=(a+Math.PI)%(Math.PI*2);
      if(a<0) a+=Math.PI*2;
      return a-Math.PI;
    };

    for(const [leftKey,rightKey] of pairs){
      const leftBone=bones[leftKey];
      const rightBone=bones[rightKey];
      const rightRest=rest[rightKey];
      if(!leftBone || !rightBone || !rightRest) continue;

      security.root.updateMatrixWorld(true);

      const leftWorldRot=
        new THREE.Matrix4().extractRotation(leftBone.matrixWorld);

      const leftCharacterRot=
        invRootRot.clone().multiply(leftWorldRot);

      const mirroredCharacterRot=
        reflectX.clone()
          .multiply(leftCharacterRot)
          .multiply(reflectX);

      const desiredWorldRot=
        rootRot.clone().multiply(mirroredCharacterRot);

      const parentWorldRot=
        new THREE.Matrix4().extractRotation(rightBone.parent.matrixWorld);
      const desiredLocalRot=
        parentWorldRot.clone().invert().multiply(desiredWorldRot);

      const targetQuat=
        new THREE.Quaternion().setFromRotationMatrix(desiredLocalRot);

      const targetEuler=
        new THREE.Euler().setFromQuaternion(
          targetQuat,
          rightBone.rotation.order
        );

      b[rightKey]={
        x:THREE.MathUtils.radToDeg(
          wrapPi(targetEuler.x-rightRest.x)
        ),
        y:THREE.MathUtils.radToDeg(
          wrapPi(targetEuler.y-rightRest.y)
        ),
        z:THREE.MathUtils.radToDeg(
          wrapPi(targetEuler.z-rightRest.z)
        )
      };

      rightBone.rotation.copy(targetEuler);
      rightBone.updateMatrix();
      security.root.updateMatrixWorld(true);
    }
  } finally {

    for(const item of saved){
      item.bone.quaternion.copy(item.quat);
      item.bone.updateMatrix();
    }
    security.root.updateMatrixWorld(true);
  }

  for(const [key,v] of Object.entries(SECURITY_POSE_EDITOR.fingerOffsets)){
    if(!key.startsWith("left_")) continue;
    const rightKey="right_"+key.slice(5);
    if(!bones[rightKey]) continue;

    SECURITY_FINAL_POSE_EDITOR.fingers[rightKey]={
      x:v.x||0,
      y:-(v.y||0),
      z:-(v.z||0)
    };
  }
}
function cacheSecurityFinalPoseDefaults(){
  if(!SECURITY_POSE_EDITOR.bones.leftArm){
    cacheSecurityPoseEditorBones();
  }

  for(const key of ["leftShoulder","leftArm","leftForeArm","leftHand"]){
    const v=SECURITY_POSE_EDITOR.offsets[key] || {x:0,y:0,z:0};
    SECURITY_FINAL_POSE_EDITOR.body[key]={x:v.x||0,y:v.y||0,z:v.z||0};
  }

  for(const [key,v] of Object.entries(SECURITY_POSE_EDITOR.fingerOffsets)){
    if(!key.startsWith("left_")) continue;
    SECURITY_FINAL_POSE_EDITOR.fingers[key]={
      x:v.x||0,
      y:v.y||0,
      z:v.z||0
    };
  }

  securityMirrorLeftFinalToRight();
  applyUserApprovedSecurityFinalPoseValues();
}

function applyUserApprovedSecurityFinalPoseValues(){
  const b=SECURITY_FINAL_POSE_EDITOR.body;
  const f=SECURITY_FINAL_POSE_EDITOR.fingers;

  b.leftShoulder={x:0,y:1,z:-5};
  b.leftArm={x:0,y:3,z:0};
  b.leftForeArm={x:0,y:22,z:7};
  b.leftHand={x:0,y:0,z:0};

  b.rightShoulder={x:-5,y:1,z:9};
  b.rightArm={
    x:15.469860468532177,
    y:4.323944878270592,
    z:18.907607239317095
  };
  b.rightForeArm={
    x:15.469860468532229,
    y:52.484513367006954,
    z:37.404229122638775
  };
  b.rightHand={
    x:-5.852554118987924,
    y:-11.125095166644414,
    z:30.58354829751882
  };

  for(const key of Object.keys(f)){
    f[key]={x:0,y:0,z:0};
  }

  f.left_thumb_1={x:-11,y:0,z:-21};
  f.left_thumb_2={x:9,y:0,z:0};

  f.right_thumb_1={x:-11,y:0,z:21};
  f.right_thumb_2={x:9,y:0,z:0};
}

function captureSecurityFinalPoseTransition(){
  if(!SECURITY_POSE_EDITOR.bones.leftArm){
    cacheSecurityPoseEditorBones();
  }

  SECURITY_FINAL_POSE_EDITOR.transitionFrom={};

  for(const key of Object.keys(SECURITY_FINAL_POSE_EDITOR.body)){
    const bone=SECURITY_POSE_EDITOR.bones[key];
    if(bone){
      SECURITY_FINAL_POSE_EDITOR.transitionFrom[key]=bone.rotation.clone();
    }
  }

  for(const key of Object.keys(SECURITY_FINAL_POSE_EDITOR.fingers)){
    const bone=SECURITY_POSE_EDITOR.bones[key];
    if(bone){
      SECURITY_FINAL_POSE_EDITOR.transitionFrom[key]=bone.rotation.clone();
    }
  }

  SECURITY_FINAL_POSE_EDITOR.transitionStart=performance.now();
  SECURITY_FINAL_POSE_EDITOR.transitionActive=true;
}

function getSecurityFinalTargetEuler(key,offset){
  const rest=SECURITY_POSE_EDITOR.rest[key];
  if(!rest || !offset) return null;

  return new THREE.Euler(
    rest.x+THREE.MathUtils.degToRad(offset.x||0),
    rest.y+THREE.MathUtils.degToRad(offset.y||0),
    rest.z+THREE.MathUtils.degToRad(offset.z||0)
  );
}

function applySecurityFinalPose(){
  const security=questGetPolice();
  if(!security?.root) return;

  if(!SECURITY_POSE_EDITOR.bones.leftArm){
    cacheSecurityPoseEditorBones();
  }

  const raw=SECURITY_FINAL_POSE_EDITOR.transitionActive
    ? THREE.MathUtils.clamp(
        (performance.now()-SECURITY_FINAL_POSE_EDITOR.transitionStart)/
        Math.max(1,SECURITY_FINAL_POSE_EDITOR.transitionDuration),
        0,
        1
      )
    : 1;

  const t=raw*raw*(3-2*raw);

  const applyOne=(key,offset)=>{
    const bone=SECURITY_POSE_EDITOR.bones[key];
    const target=getSecurityFinalTargetEuler(key,offset);
    if(!bone || !target) return;

    if(SECURITY_FINAL_POSE_EDITOR.transitionActive){
      const from=
        SECURITY_FINAL_POSE_EDITOR.transitionFrom[key] ||
        bone.rotation;

      bone.rotation.set(
        THREE.MathUtils.lerp(from.x,target.x,t),
        THREE.MathUtils.lerp(from.y,target.y,t),
        THREE.MathUtils.lerp(from.z,target.z,t)
      );
    }else{
      bone.rotation.copy(target);
    }
  };

  for(const [key,offset] of Object.entries(SECURITY_FINAL_POSE_EDITOR.body)){
    applyOne(key,offset);
  }

  for(const [key,offset] of Object.entries(SECURITY_FINAL_POSE_EDITOR.fingers)){
    applyOne(key,offset);
  }

  security.root.updateMatrixWorld(true);

  if(raw>=1){
    SECURITY_FINAL_POSE_EDITOR.transitionActive=false;
    SECURITY_FINAL_POSE_EDITOR.transitionFrom={};
  }
}

function refreshSecurityFinalPoseReadout(){
  const read=SECURITY_FINAL_POSE_EDITOR.readout;
  if(!read) return;

  const lines=["SECURITY FINAL POSE · AFTER TALK"];
  for(const [key,v] of Object.entries(SECURITY_FINAL_POSE_EDITOR.body)){
    lines.push(`${key}: x ${v.x}° · y ${v.y}° · z ${v.z}°`);
  }

  lines.push("");
  lines.push("FINGERS / PHALANGES");

  for(const key of Object.keys(SECURITY_FINAL_POSE_EDITOR.fingers).sort()){
    const v=SECURITY_FINAL_POSE_EDITOR.fingers[key];
    lines.push(`${key}: x ${v.x}° · y ${v.y}° · z ${v.z}°`);
  }

  read.textContent=lines.join("\n");
}

function makeSecurityPanelCollapsible(panel,titleEl,storageKey){
  if(!panel || panel.dataset.collapsibleReady==="1") return;
  panel.dataset.collapsibleReady="1";

  const toggle=document.createElement("button");
  toggle.type="button";
  toggle.textContent="−";
  toggle.title="Riduci / apri pannello";

  Object.assign(toggle.style,{
    float:"right",
    width:"28px",
    height:"24px",
    marginLeft:"8px",
    padding:"0",
    border:"1px solid rgba(255,255,255,.22)",
    borderRadius:"6px",
    background:"rgba(255,255,255,.08)",
    color:"#fff",
    cursor:"pointer",
    font:"900 16px/20px Arial"
  });

  titleEl.prepend(toggle);

  const body=document.createElement("div");
  body.className="securityPanelCollapsibleBody";

  while(titleEl.nextSibling){
    body.appendChild(titleEl.nextSibling);
  }
  panel.appendChild(body);

  let collapsed=false;

  const setCollapsed=(value)=>{
    collapsed=!!value;
    body.style.display=collapsed ? "none" : "";
    toggle.textContent=collapsed ? "+" : "−";
    toggle.title=collapsed ? "Apri pannello" : "Riduci pannello";

    panel.style.width=collapsed ? "170px" : "";
    panel.style.maxHeight=collapsed ? "38px" : "";

    try{
      localStorage.setItem(storageKey,collapsed ? "1" : "0");
    }catch(e){}
  };

  toggle.addEventListener("click",(e)=>{
    e.preventDefault();
    e.stopPropagation();
    setCollapsed(!collapsed);
  });

  titleEl.style.cursor="pointer";
  titleEl.addEventListener("click",(e)=>{
    if(e.target===toggle) return;
    setCollapsed(!collapsed);
  });

  try{
    collapsed=localStorage.getItem(storageKey)==="1";
  }catch(e){}

  setCollapsed(collapsed);
}

function ensureSecurityFinalPoseEditor(){
  if(SECURITY_FINAL_POSE_EDITOR.panel){
    return SECURITY_FINAL_POSE_EDITOR.panel;
  }

  cacheSecurityFinalPoseDefaults();

  const panel=document.createElement("div");
  panel.id="securityFinalPoseEditor";

  Object.assign(panel.style,{
    position:"fixed",
    right:"18px",
    top:"18px",
    width:"285px",
    maxHeight:"64vh",
    overflowY:"auto",
    zIndex:"24650",
    display:"none",
    padding:"13px",
    borderRadius:"11px",
    background:"rgba(7,10,16,.97)",
    border:"1px solid rgba(112,184,255,.36)",
    color:"#fff",
    font:"12px Arial,sans-serif",
    boxShadow:"0 14px 38px rgba(0,0,0,.48)"
  });

  const title=document.createElement("div");
  title.textContent="SECURITY FINAL POSE";
  Object.assign(title.style,{
    font:"900 13px Arial,sans-serif",
    letterSpacing:".10em",
    marginBottom:"6px"
  });
  panel.appendChild(title);

  const subtitle=document.createElement("div");
  subtitle.textContent=
    "Si apre solo dopo il TALK. Modifica la posa finale in tempo reale.";
  Object.assign(subtitle.style,{
    color:"rgba(255,255,255,.66)",
    fontSize:"10px",
    lineHeight:"1.4",
    marginBottom:"9px"
  });
  panel.appendChild(subtitle);

  const read=document.createElement("pre");
  Object.assign(read.style,{
    whiteSpace:"pre-wrap",
    margin:"0 0 7px",
    padding:"6px",
    maxHeight:"92px",
    overflowY:"auto",
    borderRadius:"6px",
    background:"rgba(255,255,255,.045)",
    color:"rgba(255,255,255,.70)",
    font:"9px/1.28 monospace"
  });
  panel.appendChild(read);
  SECURITY_FINAL_POSE_EDITOR.readout=read;

  const makeAxisControls=(container,key,targetObject,min=-160,max=160)=>{
    const h=document.createElement("div");
    h.textContent=key
      .replace(/([A-Z])/g," $1")
      .replace(/^./,c=>c.toUpperCase());
    Object.assign(h.style,{
      marginTop:"8px",
      paddingTop:"7px",
      borderTop:"1px solid rgba(255,255,255,.08)",
      fontWeight:"900",
      fontSize:"10px",
      letterSpacing:".07em"
    });
    container.appendChild(h);

    for(const axis of ["x","y","z"]){
      const row=document.createElement("div");
      Object.assign(row.style,{
        display:"grid",
        gridTemplateColumns:"18px 1fr 48px",
        gap:"6px",
        alignItems:"center",
        margin:"4px 0"
      });

      const label=document.createElement("span");
      label.textContent=axis.toUpperCase();

      const slider=document.createElement("input");
      slider.type="range";
      slider.min=String(min);
      slider.max=String(max);
      slider.step="1";
      slider.value=String(targetObject[key][axis]||0);

      const value=document.createElement("span");
      value.textContent=`${slider.value}°`;
      value.style.textAlign="right";

      slider.addEventListener("input",()=>{
        targetObject[key][axis]=Number(slider.value);
        value.textContent=`${slider.value}°`;

        SECURITY_FINAL_POSE_EDITOR.transitionActive=false;
        applySecurityFinalPose();
        refreshSecurityFinalPoseReadout();
      });

      row.append(label,slider,value);
      container.appendChild(row);
    }
  };

  const upper=document.createElement("div");
  panel.appendChild(upper);

  for(const key of [
    "leftShoulder","leftArm","leftForeArm","leftHand",
    "rightShoulder","rightArm","rightForeArm","rightHand"
  ]){
    makeAxisControls(
      upper,
      key,
      SECURITY_FINAL_POSE_EDITOR.body,
      -160,
      160
    );
  }

  const addFingerDetails=(side)=>{
    const details=document.createElement("details");
    details.style.marginTop="10px";

    const summary=document.createElement("summary");
    summary.textContent=`${side.toUpperCase()} FINGERS / PHALANGES`;
    Object.assign(summary.style,{
      cursor:"pointer",
      fontWeight:"900",
      letterSpacing:".06em"
    });
    details.appendChild(summary);

    for(const key of Object.keys(SECURITY_FINAL_POSE_EDITOR.fingers)
      .filter(k=>k.startsWith(side+"_"))
      .sort()){
      makeAxisControls(
        details,
        key,
        SECURITY_FINAL_POSE_EDITOR.fingers,
        -120,
        120
      );
    }

    panel.appendChild(details);
  };

  addFingerDetails("left");
  addFingerDetails("right");

  const mirror=document.createElement("button");
  mirror.textContent="MIRROR LEFT → RIGHT · GLB AXES";
  Object.assign(mirror.style,{
    width:"100%",
    marginTop:"10px",
    padding:"8px",
    cursor:"pointer",
    fontWeight:"900"
  });
  mirror.addEventListener("click",()=>{
    securityMirrorLeftFinalToRight();

    panel.remove();
    SECURITY_FINAL_POSE_EDITOR.panel=null;
    SECURITY_FINAL_POSE_EDITOR.readout=null;

    ensureSecurityFinalPoseEditor();
    SECURITY_FINAL_POSE_EDITOR.panel.style.display="block";
    SECURITY_FINAL_POSE_EDITOR.transitionActive=false;
    applySecurityFinalPose();
  });
  panel.appendChild(mirror);

  const print=document.createElement("button");
  print.textContent="PRINT / COPY FINAL POSE";
  Object.assign(print.style,{
    width:"100%",
    marginTop:"6px",
    padding:"8px",
    cursor:"pointer",
    fontWeight:"900"
  });
  print.addEventListener("click",async()=>{
    const output=
      "SECURITY FINAL POSE AFTER TALK\n"+
      JSON.stringify(SECURITY_FINAL_POSE_EDITOR.body,null,2)+
      "\n\nSECURITY FINAL FINGERS / PHALANGES\n"+
      JSON.stringify(SECURITY_FINAL_POSE_EDITOR.fingers,null,2);

    console.log(output);

    try{
      await navigator.clipboard.writeText(output);
      print.textContent="COPIED + PRINTED";
    }catch(e){
      print.textContent="PRINTED TO CONSOLE";
    }

    setTimeout(()=>{
      print.textContent="PRINT / COPY FINAL POSE";
    },1400);
  });
  panel.appendChild(print);

  makeSecurityPanelCollapsible(
    panel,
    title,
    "securityFinalPosePanelCollapsed"
  );

  document.body.appendChild(panel);
  SECURITY_FINAL_POSE_EDITOR.panel=panel;

  refreshSecurityFinalPoseReadout();
  return panel;
}

function cacheSecurityPoseEditorBones(){
  const security=questGetPolice();
  if(!security?.root) return false;

  const map={};

  security.root.traverse(o=>{
    if(!o?.isBone) return;

    const n=String(o.name||"").toLowerCase();

    if(n.includes("leftshoulder")){
      map.leftShoulder=o;
    }else if(n.includes("leftarm") && !n.includes("fore")){
      map.leftArm=o;
    }else if(n.includes("leftforearm")){
      map.leftForeArm=o;
    }else if(
      n.includes("lefthand") &&
      !n.includes("thumb") &&
      !n.includes("index") &&
      !n.includes("middle") &&
      !n.includes("ring") &&
      !n.includes("pinky")
    ){
      map.leftHand=o;
    }else if(n.includes("rightshoulder")){
      map.rightShoulder=o;
    }else if(n.includes("rightarm") && !n.includes("fore")){
      map.rightArm=o;
    }else if(n.includes("rightforearm")){
      map.rightForeArm=o;
    }else if(
      n.includes("righthand") &&
      !n.includes("thumb") &&
      !n.includes("index") &&
      !n.includes("middle") &&
      !n.includes("ring") &&
      !n.includes("pinky")
    ){
      map.rightHand=o;
    }
  });

  security.root.traverse(o=>{
    if(!o?.isBone) return;
    const clean=String(o.name||"")
      .toLowerCase()
      .replace(/[^a-z0-9]/g,"");

    const match=clean.match(
      /(left|right)hand(thumb|index|middle|ring|pinky|little)([1-4])/
    );
    if(!match) return;

    const side=match[1];
    const finger=match[2]==="little" ? "pinky" : match[2];
    const segment=match[3];
    const key=`${side}_${finger}_${segment}`;

    map[key]=o;

    if(!SECURITY_POSE_EDITOR.fingerOffsets[key]){
      SECURITY_POSE_EDITOR.fingerOffsets[key]={x:0,y:0,z:0};
    }
  });

  SECURITY_POSE_EDITOR.bones=map;

  for(const key of Object.keys(SECURITY_POSE_EDITOR.offsets)){
    const bone=map[key];
    if(!bone) continue;

    if(!SECURITY_POSE_EDITOR.rest[key]){
      SECURITY_POSE_EDITOR.rest[key]=bone.rotation.clone();
    }
  }

  for(const key of Object.keys(SECURITY_POSE_EDITOR.fingerOffsets)){
    const bone=map[key];
    if(!bone) continue;
    if(!SECURITY_POSE_EDITOR.rest[key]){
      SECURITY_POSE_EDITOR.rest[key]=bone.rotation.clone();
    }
  }

  return Object.keys(map).length>0;
}

function updateSecurityPoseEditor(){
  const security=questGetPolice();
  if(!security?.root) return;

  hideAllSecurityContextPanels();

  if(
    SECURITY_POST_CASE_HOME_LOCK &&
    QUEST.stage==="game_complete" &&
    STOREKEEPER_FINAL.completed
  ){
    SECURITY_POSE_EDITOR.wasTalking=false;
    SECURITY_POSE_EDITOR.rightNeutralAfterTalk=false;
    SECURITY_POSE_EDITOR.rightReturnActive=false;
    SECURITY_POSE_EDITOR.rightReturnFrom={};
    SECURITY_POSE_EDITOR.finalPoseActive=false;
    SECURITY_FINAL_POSE_EDITOR.transitionActive=false;
    SECURITY_FINAL_POSE_EDITOR.transitionFrom={};
    return;
  }

  const securityIsTalking =
    security.state==="talk" ||
    (
      QUEST.dialogueActive &&
      (
        String(QUEST.dialogueSpeaker||"").toUpperCase()==="SECURITY" ||
        String(QUEST.dialogueSpeaker||"").toUpperCase()==="POLICE"
      )
    ) ||
    (
      GLOBAL_DIALOGUE_LOCK.active &&
      GLOBAL_DIALOGUE_LOCK.npc===security
    );

  const finalPanel=ensureSecurityFinalPoseEditor();

  if(securityIsTalking){
SECURITY_FINAL_POSE_EDITOR.transitionActive=false;
    SECURITY_POSE_EDITOR.rightReturnActive=false;
    SECURITY_POSE_EDITOR.rightReturnFrom={};
  }else{
    if(SECURITY_POSE_EDITOR.wasTalking){

      SECURITY_POSE_EDITOR.rightNeutralAfterTalk=true;
      cacheSecurityFinalPoseDefaults();
      captureSecurityFinalPoseTransition();
    }

    if(SECURITY_POSE_EDITOR.rightNeutralAfterTalk){

      applySecurityFinalPose();
}else{

      if(!SECURITY_POSE_EDITOR.bones.leftArm){
        cacheSecurityPoseEditorBones();
      }

      for(const key of ["leftShoulder","leftArm","leftForeArm","leftHand"]){
        const bone=SECURITY_POSE_EDITOR.bones[key];
        const rest=SECURITY_POSE_EDITOR.rest[key];
        const offset=SECURITY_POSE_EDITOR.offsets[key];
        if(!bone || !rest || !offset) continue;

        bone.rotation.set(
          rest.x+THREE.MathUtils.degToRad(offset.x||0),
          rest.y+THREE.MathUtils.degToRad(offset.y||0),
          rest.z+THREE.MathUtils.degToRad(offset.z||0)
        );
      }

      for(const [key,offset] of Object.entries(SECURITY_POSE_EDITOR.fingerOffsets)){
        if(!key.startsWith("left_")) continue;

        const bone=SECURITY_POSE_EDITOR.bones[key];
        const rest=SECURITY_POSE_EDITOR.rest[key];
        if(!bone || !rest) continue;

        bone.rotation.set(
          rest.x+THREE.MathUtils.degToRad(offset.x||0),
          rest.y+THREE.MathUtils.degToRad(offset.y||0),
          rest.z+THREE.MathUtils.degToRad(offset.z||0)
        );
      }

      security.root.updateMatrixWorld(true);
      finalPanel.style.display="none";
    }
  }

  SECURITY_POSE_EDITOR.wasTalking=securityIsTalking;
  SECURITY_POSE_EDITOR.returnActive=false;
}

const SECURITY_HEAD_SPEECH_STATE=new WeakMap();
function getSecurityHeadSpeechState(c){
  let state=SECURITY_HEAD_SPEECH_STATE.get(c);
  if(state) return state;
  const head=c.bones.find((bone)=>bone.name==="mixamorig:Head_06") || null;
  state={
    head,
    rest:head ? head.rotation.clone() : null,
    warned:false
  };
  SECURITY_HEAD_SPEECH_STATE.set(c,state);
  return state;
}
function animateSecurityHeadSpeech(c,talking=false){
  if(c.name!=="securityMan") return;
  const state=getSecurityHeadSpeechState(c);
  if(!state.head || !state.rest){
    if(!state.warned){
      state.warned=true;
    }
    return;
  }
  const now=performance.now();
  const nod=Math.sin(now*.0055);
  const turn=Math.sin(now*.0037+1.1);
  const targetX=state.rest.x+(talking ? Math.sin(now*.0066)*.050 : 0);
  const targetY=state.rest.y+(talking ? turn*.026 : 0);
  const targetZ=state.rest.z+(talking ? Math.sin(now*.0043+.4)*.010 : 0);
  smoothBoneTo(
    state.head,
    targetX,
    targetY,
    targetZ,
    talking ? .10 : .08
  );
}
const SECURITY_FINGER_STATE=new WeakMap();
function cleanBoneName(name){
  return (name || "").toLowerCase().replace(/[^a-z0-9]/g,"");
}
function getFingerSegment(name){
  const match=name.match(/(?:thumb|index|middle|ring|pinky|little)([1-4])/);
  return match ? Number(match[1]) : 0;
}
function isSecurityFingerBone(name){
  const n=cleanBoneName(name);
  const isFinger=
    n.includes("thumb") ||
    n.includes("index") ||
    n.includes("middle") ||
    n.includes("ring") ||
    n.includes("pinky") ||
    n.includes("little");
  const segment=getFingerSegment(n);
  return isFinger && segment>=1 && segment<=3;
}
function getSecurityFingerState(c){
  let state=SECURITY_FINGER_STATE.get(c);
  if(state) return state;
  const fingers=c.bones
    .filter((bone)=>isSecurityFingerBone(bone.name))
    .map((bone)=>({
      bone,
      rest:bone.rotation.clone(),
      name:cleanBoneName(bone.name),
      segment:getFingerSegment(cleanBoneName(bone.name))
    }));
  state={fingers};
  SECURITY_FINGER_STATE.set(c,state);
  return state;
}
function getMainFingerCurl(name,segment){
  let amount=0;
  if(segment===1) amount=0.72;
  else if(segment===2) amount=1.02;
  else if(segment===3) amount=0.82;
  if(name.includes("index")) amount*=0.92;
  else if(name.includes("middle")) amount*=1.00;
  else if(name.includes("ring")) amount*=1.05;
  else if(name.includes("pinky") || name.includes("little")) amount*=1.08;
  return amount;
}
function animateSecurityFingers(c,talking=false){
  if(c.name!=="securityMan") return;
  const state=getSecurityFingerState(c);
  if(!state.fingers.length) return;
  const lookingAtThief=
    talking &&
    FINAL_SECURITY_DIALOGUE_FACING?.active &&
    FINAL_SECURITY_DIALOGUE_FACING.mode==="thief";

  const t=performance.now()*(lookingAtThief ? .0028 : .007);
  const waveA=(Math.sin(t)+1)*.5;
  const waveB=(Math.sin(t*1.63+.8)+1)*.5;
  const gesture=waveA*.65+waveB*.35;

  const closure=talking
    ? (
        lookingAtThief
          ? THREE.MathUtils.lerp(.30,.265,gesture)
          : THREE.MathUtils.lerp(.34,.20,gesture)
      )
    : .34;
  for(const item of state.fingers){
    const {bone,rest,name,segment}=item;
    const isLeft=name.includes("left");
    if(name.includes("thumb")){
      let addX=0;
      let addZ=0;
      if(segment===1){
        addX=-0.07;
        addZ=isLeft ? -0.12 : 0.12;
      }else if(segment===2){
        addX=-0.17;
        addZ=isLeft ? -0.16 : 0.16;
      }else if(segment===3){
        addX=-0.16;
        addZ=isLeft ? -0.04 : 0.04;
      }
      smoothBoneTo(
        bone,
        rest.x+addX*closure,
        rest.y,
        rest.z+addZ*closure,
        talking ? (lookingAtThief ? .065 : .14) : .11
      );
      continue;
    }
    const addX=getMainFingerCurl(name,segment)*closure;
    smoothBoneTo(
      bone,
      rest.x+addX,
      rest.y,
      rest.z,
      talking ? (lookingAtThief ? .065 : .14) : .11
    );
  }
}

const SECURITY_OLD_TALK_PANEL={
  panel:null,
  readout:null,
  initialized:false,
  agitation:{
    level:0.95,
    speed:0.82,
    shoulders:{amount:0.28,axis:"z"},
    forearms:{amount:0.88,axis:"z"},
    hands:{amount:0.88,axis:"xyz"},
    torso:{amount:0.22,axis:"z"},
    neck:{amount:0.18,axis:"y"},
    head:{amount:0.25,axis:"xy"}
  },
  target:{
    leftArm:{x:0,y:0,z:0},
    rightArm:{x:0,y:0,z:0},
    leftForeArm:{x:0,y:0,z:0},
    rightForeArm:{x:0,y:0,z:0},
    leftHand:{x:0,y:0,z:0},
    rightHand:{x:0,y:0,z:0}
  }
};

function initSecurityOldTalkPanelTargets(c){
  if(SECURITY_OLD_TALK_PANEL.initialized) return;

  const D=THREE.MathUtils.degToRad;

  SECURITY_OLD_TALK_PANEL.target.leftArm={
    x:D(62), y:D(0), z:D(0)
  };
  SECURITY_OLD_TALK_PANEL.target.leftForeArm={
    x:D(10), y:D(1), z:D(17)
  };
  SECURITY_OLD_TALK_PANEL.target.leftHand={
    x:D(0), y:D(0), z:D(-18.5)
  };

  SECURITY_OLD_TALK_PANEL.target.rightArm={
    x:D(60.5), y:D(0), z:D(0)
  };
  SECURITY_OLD_TALK_PANEL.target.rightForeArm={
    x:D(-1), y:D(1), z:D(-65.5)
  };
  SECURITY_OLD_TALK_PANEL.target.rightHand={
    x:D(10), y:D(0), z:D(-5)
  };

  SECURITY_OLD_TALK_PANEL.initialized=true;
}

function securityAddAgitationControls(panel,settings,refreshFn,prefix){
  const wrap=document.createElement("details");
  wrap.open=false;
  Object.assign(wrap.style,{
    marginTop:"9px",
    borderTop:"1px solid rgba(255,255,255,.10)",
    paddingTop:"8px"
  });

  const summary=document.createElement("summary");
  summary.textContent="AGITATION CONTROLS";
  Object.assign(summary.style,{
    cursor:"pointer",
    fontWeight:"900",
    letterSpacing:".06em"
  });
  wrap.appendChild(summary);

  const makeSlider=(label,keyObj,key,min,max,step)=>{
    const row=document.createElement("div");
    Object.assign(row.style,{
      display:"grid",
      gridTemplateColumns:"100px 1fr 46px",
      gap:"6px",
      alignItems:"center",
      margin:"5px 0"
    });

    const lab=document.createElement("span");
    lab.textContent=label;
    lab.style.fontSize="10px";

    const slider=document.createElement("input");
    slider.type="range";
    slider.min=String(min);
    slider.max=String(max);
    slider.step=String(step);
    slider.value=String(keyObj[key]);

    const value=document.createElement("span");
    value.textContent=Number(slider.value).toFixed(2);
    value.style.textAlign="right";
    value.style.fontFamily="monospace";

    slider.addEventListener("input",()=>{
      keyObj[key]=Number(slider.value);
      value.textContent=Number(slider.value).toFixed(2);
      refreshFn();
    });

    row.append(lab,slider,value);
    wrap.appendChild(row);
  };

  makeSlider("LEVEL",settings,"level",0,2,.05);
  makeSlider("SPEED",settings,"speed",.25,2,.05);

  const parts=[
    ["shoulders","SHOULDERS"],
    ["forearms","FOREARMS"],
    ["hands","HANDS"],
    ["torso","TORSO"],
    ["neck","NECK"],
    ["head","HEAD"]
  ];

  for(const [key,label] of parts){
    const section=document.createElement("div");
    Object.assign(section.style,{
      marginTop:"8px",
      paddingTop:"7px",
      borderTop:"1px solid rgba(255,255,255,.07)"
    });

    const title=document.createElement("div");
    title.textContent=label;
    title.style.fontWeight="800";
    title.style.fontSize="10px";
    title.style.marginBottom="4px";
    section.appendChild(title);

    const amtRow=document.createElement("div");
    Object.assign(amtRow.style,{
      display:"grid",
      gridTemplateColumns:"100px 1fr 46px",
      gap:"6px",
      alignItems:"center",
      margin:"4px 0"
    });

    const amtLab=document.createElement("span");
    amtLab.textContent="AMOUNT";
    amtLab.style.fontSize="10px";

    const amt=document.createElement("input");
    amt.type="range";
    amt.min="0";
    amt.max="2";
    amt.step=".05";
    amt.value=String(settings[key].amount);

    const amtVal=document.createElement("span");
    amtVal.textContent=Number(amt.value).toFixed(2);
    amtVal.style.textAlign="right";
    amtVal.style.fontFamily="monospace";

    amt.addEventListener("input",()=>{
      settings[key].amount=Number(amt.value);
      amtVal.textContent=Number(amt.value).toFixed(2);
      refreshFn();
    });

    amtRow.append(amtLab,amt,amtVal);
    section.appendChild(amtRow);

    const axisRow=document.createElement("div");
    Object.assign(axisRow.style,{
      display:"grid",
      gridTemplateColumns:"100px 1fr",
      gap:"6px",
      alignItems:"center",
      margin:"4px 0"
    });

    const axisLab=document.createElement("span");
    axisLab.textContent="DIRECTION";
    axisLab.style.fontSize="10px";

    const select=document.createElement("select");
    for(const value of ["x","y","z","xy","xz","yz","xyz"]){
      const opt=document.createElement("option");
      opt.value=value;
      opt.textContent=value.toUpperCase();
      if(settings[key].axis===value) opt.selected=true;
      select.appendChild(opt);
    }

    select.addEventListener("change",()=>{
      settings[key].axis=select.value;
      refreshFn();
    });

    axisRow.append(axisLab,select);
    section.appendChild(axisRow);

    wrap.appendChild(section);
  }

  panel.appendChild(wrap);
}

function refreshSecurityOldTalkPanel(){
  const read=SECURITY_OLD_TALK_PANEL.readout;
  if(!read) return;

  const d=v=>Math.round(THREE.MathUtils.radToDeg(v)*10)/10;
  const lines=["SECURITY TALK · ORIGINAL ANIMATION"];

  for(const [key,v] of Object.entries(SECURITY_OLD_TALK_PANEL.target)){
    lines.push(`${key}: x ${d(v.x)}° · y ${d(v.y)}° · z ${d(v.z)}°`);
  }

  const a=SECURITY_OLD_TALK_PANEL.agitation;
  lines.push("");
  lines.push(`AGITATION level ${a.level.toFixed(2)} · speed ${a.speed.toFixed(2)}`);
  lines.push(`forearms ${a.forearms.amount.toFixed(2)} ${a.forearms.axis.toUpperCase()} · hands ${a.hands.amount.toFixed(2)} ${a.hands.axis.toUpperCase()}`);
  lines.push(`shoulders ${a.shoulders.amount.toFixed(2)} ${a.shoulders.axis.toUpperCase()} · torso ${a.torso.amount.toFixed(2)} ${a.torso.axis.toUpperCase()}`);
  lines.push(`neck ${a.neck.amount.toFixed(2)} ${a.neck.axis.toUpperCase()} · head ${a.head.amount.toFixed(2)} ${a.head.axis.toUpperCase()}`);

  read.textContent=lines.join("\n");
}

function ensureSecurityOldTalkPanel(c){
  initSecurityOldTalkPanelTargets(c);

  if(SECURITY_OLD_TALK_PANEL.panel){
    return SECURITY_OLD_TALK_PANEL.panel;
  }

  const panel=document.createElement("div");
  panel.id="securityOldTalkPanel";

  Object.assign(panel.style,{
    position:"fixed",
    right:"18px",
    top:"90px",
    width:"285px",
    maxHeight:"64vh",
    overflowY:"auto",
    zIndex:"24750",
    display:"none",
    padding:"12px",
    borderRadius:"11px",
    background:"rgba(8,10,15,.97)",
    border:"1px solid rgba(255,190,90,.38)",
    color:"#fff",
    font:"12px Arial,sans-serif",
    boxShadow:"0 14px 38px rgba(0,0,0,.48)"
  });

  const title=document.createElement("div");
  title.textContent="SECURITY TALK POSITION";
  Object.assign(title.style,{
    font:"900 13px Arial,sans-serif",
    letterSpacing:".09em",
    marginBottom:"6px"
  });
  panel.appendChild(title);

  const sub=document.createElement("div");
  sub.textContent=
    "La TALK resta quella vecchia. Qui cambi solo la posizione verso cui braccia, avambracci e mani interpolano.";
  Object.assign(sub.style,{
    color:"rgba(255,255,255,.68)",
    fontSize:"10px",
    lineHeight:"1.4",
    marginBottom:"9px"
  });
  panel.appendChild(sub);

  const read=document.createElement("pre");
  Object.assign(read.style,{
    whiteSpace:"pre-wrap",
    margin:"0 0 7px",
    padding:"6px",
    maxHeight:"88px",
    overflowY:"auto",
    borderRadius:"6px",
    background:"rgba(255,255,255,.045)",
    color:"rgba(255,255,255,.72)",
    font:"9px/1.28 monospace"
  });
  panel.appendChild(read);
  SECURITY_OLD_TALK_PANEL.readout=read;

  const labels={
    leftArm:"LEFT ARM",
    leftForeArm:"LEFT FOREARM",
    leftHand:"LEFT HAND",
    rightArm:"RIGHT ARM",
    rightForeArm:"RIGHT FOREARM",
    rightHand:"RIGHT HAND"
  };

  for(const [key,labelText] of Object.entries(labels)){
    const sec=document.createElement("div");
    Object.assign(sec.style,{
      borderTop:"1px solid rgba(255,255,255,.08)",
      paddingTop:"7px",
      marginTop:"7px"
    });

    const h=document.createElement("div");
    h.textContent=labelText;
    h.style.fontWeight="900";
    h.style.fontSize="10px";
    h.style.letterSpacing=".07em";
    h.style.marginBottom="5px";
    sec.appendChild(h);

    for(const axis of ["x","y","z"]){
      const row=document.createElement("div");
      Object.assign(row.style,{
        display:"grid",
        gridTemplateColumns:"18px 1fr 54px",
        gap:"6px",
        alignItems:"center",
        margin:"4px 0"
      });

      const lab=document.createElement("span");
      lab.textContent=axis.toUpperCase();

      const slider=document.createElement("input");
      slider.type="range";
      slider.min="-180";
      slider.max="180";
      slider.step="1";
      slider.value=String(Math.round(
        THREE.MathUtils.radToDeg(SECURITY_OLD_TALK_PANEL.target[key][axis])
      ));

      const val=document.createElement("span");
      val.textContent=`${slider.value}°`;
      val.style.textAlign="right";

      slider.addEventListener("input",()=>{
        SECURITY_OLD_TALK_PANEL.target[key][axis]=
          THREE.MathUtils.degToRad(Number(slider.value));
        val.textContent=`${slider.value}°`;
        refreshSecurityOldTalkPanel();
      });

      row.append(lab,slider,val);
      sec.appendChild(row);
    }

    panel.appendChild(sec);
  }

  securityAddAgitationControls(
    panel,
    SECURITY_OLD_TALK_PANEL.agitation,
    refreshSecurityOldTalkPanel,
    "normalTalk"
  );

  const print=document.createElement("button");
  print.textContent="PRINT / COPY TALK POSITION";
  Object.assign(print.style,{
    width:"100%",
    marginTop:"10px",
    padding:"8px",
    cursor:"pointer",
    fontWeight:"900"
  });

  print.addEventListener("click",async()=>{
    const output={};
    for(const [key,v] of Object.entries(SECURITY_OLD_TALK_PANEL.target)){
      output[key]={
        x:Math.round(THREE.MathUtils.radToDeg(v.x)*10)/10,
        y:Math.round(THREE.MathUtils.radToDeg(v.y)*10)/10,
        z:Math.round(THREE.MathUtils.radToDeg(v.z)*10)/10
      };
    }

    const txt=
      "SECURITY TALK POSITION\n"+
      JSON.stringify(output,null,2)+
      "\n\nSECURITY TALK AGITATION\n"+
      JSON.stringify(SECURITY_OLD_TALK_PANEL.agitation,null,2);
    console.log(txt);

    try{
      await navigator.clipboard.writeText(txt);
      print.textContent="COPIED + PRINTED";
    }catch(e){
      print.textContent="PRINTED TO CONSOLE";
    }

    setTimeout(()=>print.textContent="PRINT / COPY TALK POSITION",1400);
  });

  panel.appendChild(print);

  makeSecurityPanelCollapsible(
    panel,
    title,
    "securityTalkPositionPanelCollapsed"
  );

  document.body.appendChild(panel);

  SECURITY_OLD_TALK_PANEL.panel=panel;
  refreshSecurityOldTalkPanel();
  return panel;
}

function updateSecurityOldTalkPanel(c){
  ensureSecurityOldTalkPanel(c);
}

function mirrorSecurityTalkBoneWorld(c,leftBone,rightBone){
  if(!c?.root || !leftBone || !rightBone || !rightBone.parent) return;

  c.root.updateMatrixWorld(true);

  const rootRot=new THREE.Matrix4().extractRotation(c.root.matrixWorld);
  const invRootRot=rootRot.clone().invert();
  const reflectX=new THREE.Matrix4().makeScale(-1,1,1);

  const leftWorldRot=
    new THREE.Matrix4().extractRotation(leftBone.matrixWorld);

  const leftCharacterRot=
    invRootRot.clone().multiply(leftWorldRot);

  const mirroredCharacterRot=
    reflectX.clone()
      .multiply(leftCharacterRot)
      .multiply(reflectX);

  const desiredWorldRot=
    rootRot.clone().multiply(mirroredCharacterRot);

  const parentWorldRot=
    new THREE.Matrix4().extractRotation(rightBone.parent.matrixWorld);

  const desiredLocalRot=
    parentWorldRot.clone().invert().multiply(desiredWorldRot);

  const targetQuat=
    new THREE.Quaternion().setFromRotationMatrix(desiredLocalRot);

  rightBone.quaternion.slerp(targetQuat,.18);
  rightBone.updateMatrix();
  c.root.updateMatrixWorld(true);
}


const SECURITY_LOWER_BODY_EDITOR={
  panel:null,
  readout:null,
  initialized:false,
  bones:{},
  rest:{},
  offsets:{
    hips:{x:0,y:0,z:0},
    leftUpLeg:{x:0,y:0,z:0},
    rightUpLeg:{x:0,y:0,z:0},
    leftKnee:{x:0,y:0,z:0},
    rightKnee:{x:0,y:0,z:0},
    leftFoot:{x:0,y:0,z:0},
    rightFoot:{x:0,y:0,z:0},
    leftToe:{x:0,y:0,z:0},
    rightToe:{x:0,y:0,z:0}
  }
};

function cacheSecurityLowerBodyEditor(){
  const security=questGetPolice?.();
  if(!security?.root) return false;

  const b=getBones(security);
  const map={
    hips:b.hips,
    leftUpLeg:b.leftUpLeg,
    rightUpLeg:b.rightUpLeg,
    leftKnee:b.leftKnee,
    rightKnee:b.rightKnee,
    leftFoot:b.leftFoot,
    rightFoot:b.rightFoot,
    leftToe:b.leftToe,
    rightToe:b.rightToe
  };

  for(const [key,bone] of Object.entries(map)){
    if(!bone) continue;
    SECURITY_LOWER_BODY_EDITOR.bones[key]=bone;

    if(!SECURITY_LOWER_BODY_EDITOR.rest[key]){
      SECURITY_LOWER_BODY_EDITOR.rest[key]={
        x:bone.rotation.x,
        y:bone.rotation.y,
        z:bone.rotation.z
      };
    }
  }

  SECURITY_LOWER_BODY_EDITOR.initialized=true;
  return true;
}

function applySecurityLowerBodyEditor(){
  const security=questGetPolice?.();
  if(!security?.root) return;

  if(!cacheSecurityLowerBodyEditor()) return;

  const D=THREE.MathUtils.degToRad;

  for(const [key,off] of Object.entries(SECURITY_LOWER_BODY_EDITOR.offsets)){
    const bone=SECURITY_LOWER_BODY_EDITOR.bones[key];
    const rest=SECURITY_LOWER_BODY_EDITOR.rest[key];

    if(!bone || !rest) continue;

    bone.rotation.set(
      rest.x+D(off.x||0),
      rest.y+D(off.y||0),
      rest.z+D(off.z||0)
    );
  }

  security.root.updateMatrixWorld(true);
}

function refreshSecurityLowerBodyEditorReadout(){
  if(!SECURITY_LOWER_BODY_EDITOR.readout) return;

  const lines=["SECURITY LOWER BODY"];

  for(const [key,v] of Object.entries(SECURITY_LOWER_BODY_EDITOR.offsets)){
    lines.push(
      `${key}: x ${Number(v.x).toFixed(1)}° · `+
      `y ${Number(v.y).toFixed(1)}° · `+
      `z ${Number(v.z).toFixed(1)}°`
    );
  }

  SECURITY_LOWER_BODY_EDITOR.readout.textContent=lines.join("\n");
}

function ensureSecurityLowerBodyEditor(){
  if(SECURITY_LOWER_BODY_EDITOR.panel){
    return SECURITY_LOWER_BODY_EDITOR.panel;
  }

  const panel=document.createElement("div");
  panel.id="securityLowerBodyEditor";

  Object.assign(panel.style,{
    position:"fixed",
    right:"18px",
    top:"18px",
    width:"315px",
    maxHeight:"82vh",
    overflowY:"auto",
    zIndex:"999999",
    display:"block",
    padding:"10px",
    borderRadius:"10px",
    background:"rgba(8,10,15,.97)",
    border:"1px solid rgba(110,200,255,.48)",
    color:"#fff",
    font:"11px Arial,sans-serif",
    boxShadow:"0 14px 38px rgba(0,0,0,.48)"
  });

  const title=document.createElement("div");
  title.textContent="SECURITY LOWER BODY";
  Object.assign(title.style,{
    font:"900 13px Arial,sans-serif",
    letterSpacing:".07em",
    marginBottom:"5px"
  });
  panel.appendChild(title);

  const sub=document.createElement("div");
  sub.textContent="Prova pose della parte bassa del Security. Valori relativi alla posa base.";
  Object.assign(sub.style,{
    color:"rgba(255,255,255,.66)",
    fontSize:"10px",
    lineHeight:"1.35",
    marginBottom:"7px"
  });
  panel.appendChild(sub);

  const read=document.createElement("pre");
  Object.assign(read.style,{
    whiteSpace:"pre-wrap",
    margin:"0 0 8px",
    padding:"6px",
    maxHeight:"110px",
    overflowY:"auto",
    borderRadius:"6px",
    background:"rgba(255,255,255,.045)",
    color:"rgba(255,255,255,.80)",
    font:"9px/1.3 monospace"
  });
  panel.appendChild(read);
  SECURITY_LOWER_BODY_EDITOR.readout=read;

  const labels={
    hips:"HIPS",
    leftUpLeg:"LEFT UPPER LEG",
    rightUpLeg:"RIGHT UPPER LEG",
    leftKnee:"LEFT KNEE",
    rightKnee:"RIGHT KNEE",
    leftFoot:"LEFT FOOT",
    rightFoot:"RIGHT FOOT",
    leftToe:"LEFT TOE",
    rightToe:"RIGHT TOE"
  };

  for(const [key,label] of Object.entries(labels)){
    const section=document.createElement("div");
    Object.assign(section.style,{
      borderTop:"1px solid rgba(255,255,255,.08)",
      paddingTop:"6px",
      marginTop:"6px"
    });

    const h=document.createElement("div");
    h.textContent=label;
    h.style.fontWeight="900";
    h.style.fontSize="10px";
    section.appendChild(h);

    for(const axis of ["x","y","z"]){
      const row=document.createElement("div");
      Object.assign(row.style,{
        display:"grid",
        gridTemplateColumns:"18px 1fr 56px",
        gap:"5px",
        alignItems:"center",
        margin:"3px 0"
      });

      const lab=document.createElement("span");
      lab.textContent=axis.toUpperCase();

      const slider=document.createElement("input");
      slider.type="range";
      slider.min="-90";
      slider.max="90";
      slider.step=".5";
      slider.value=String(
        SECURITY_LOWER_BODY_EDITOR.offsets[key][axis]
      );

      const val=document.createElement("span");
      val.textContent=
        Number(slider.value).toFixed(1)+"°";
      val.style.textAlign="right";
      val.style.fontFamily="monospace";

      slider.addEventListener("input",()=>{
        SECURITY_LOWER_BODY_EDITOR.offsets[key][axis]=
          Number(slider.value);

        val.textContent=
          Number(slider.value).toFixed(1)+"°";

        applySecurityLowerBodyEditor();
        refreshSecurityLowerBodyEditorReadout();
      });

      row.append(lab,slider,val);
      section.appendChild(row);
    }

    panel.appendChild(section);
  }

  const reset=document.createElement("button");
  reset.textContent="RESET LOWER BODY";
  Object.assign(reset.style,{
    width:"100%",
    marginTop:"8px",
    padding:"8px",
    cursor:"pointer",
    fontWeight:"900"
  });

  reset.addEventListener("click",()=>{
    for(const v of Object.values(SECURITY_LOWER_BODY_EDITOR.offsets)){
      v.x=0; v.y=0; v.z=0;
    }

    panel.remove();
    SECURITY_LOWER_BODY_EDITOR.panel=null;
    SECURITY_LOWER_BODY_EDITOR.readout=null;

    applySecurityLowerBodyEditor();
    ensureSecurityLowerBodyEditor();
  });

  panel.appendChild(reset);

  const print=document.createElement("button");
  print.textContent="PRINT / COPY LOWER BODY";
  Object.assign(print.style,{
    width:"100%",
    marginTop:"5px",
    padding:"8px",
    cursor:"pointer",
    fontWeight:"900"
  });

  print.addEventListener("click",async()=>{
    const txt=
      "SECURITY LOWER BODY\n"+
      JSON.stringify(
        SECURITY_LOWER_BODY_EDITOR.offsets,
        null,
        2
      );

    console.log(txt);

    try{
      await navigator.clipboard.writeText(txt);
      print.textContent="COPIED + PRINTED";
    }catch(e){
      print.textContent="PRINTED TO CONSOLE";
    }

    setTimeout(()=>{
      print.textContent="PRINT / COPY LOWER BODY";
    },1300);
  });

  panel.appendChild(print);

  document.body.appendChild(panel);
  SECURITY_LOWER_BODY_EDITOR.panel=panel;

  refreshSecurityLowerBodyEditorReadout();
  return panel;
}

function updateSecurityLowerBodyEditor(){
  if(SECURITY_LOWER_BODY_EDITOR?.panel){
    SECURITY_LOWER_BODY_EDITOR.panel.style.setProperty("display","none","important");
  }

}

const SECURITY_TURN_POSE_EDITOR={
  panel:null,
  closed:false,
  readout:null,
  initialized:false,
  activePose:"start",
  bones:{},
  rest:{},
  poses:{
    start:{
      hips:{x:0,y:0,z:0},
      leftUpLeg:{x:0,y:0,z:0},
      rightUpLeg:{x:0,y:0,z:0},
      leftKnee:{x:0,y:0,z:0},
      rightKnee:{x:0,y:0,z:0},
      leftFoot:{x:0,y:0,z:0},
      rightFoot:{x:0,y:0,z:0},
      leftToe:{x:0,y:0,z:0},
      rightToe:{x:0,y:0,z:0}
    },
    mid:{
      hips:{x:0,y:1.2,z:0.35},
      leftUpLeg:{x:0.5,y:-0.9,z:-0.35},
      rightUpLeg:{x:-10.5,y:1.9,z:0.65},
      leftKnee:{x:0,y:-0.6,z:-0.25},
      rightKnee:{x:-17.5,y:0.4,z:0.25},
      leftFoot:{x:0.55,y:-1.35,z:-0.40},
      rightFoot:{x:-0.9,y:4.9,z:1.15},
      leftToe:{x:0.2,y:-0.7,z:-0.15},
      rightToe:{x:-0.45,y:2.9,z:0.30}
    },
    leftMid:{
      hips:{x:0,y:-1.2,z:-0.35},
      leftUpLeg:{x:-10.5,y:-1.9,z:-0.65},
      rightUpLeg:{x:0.5,y:0.9,z:0.35},
      leftKnee:{x:-17.5,y:-0.4,z:-0.25},
      rightKnee:{x:0,y:0.6,z:0.25},
      leftFoot:{x:-0.9,y:-4.9,z:-1.15},
      rightFoot:{x:0.55,y:1.35,z:0.40},
      leftToe:{x:-0.45,y:-2.9,z:-0.30},
      rightToe:{x:0.2,y:0.7,z:0.15}
    },
    end:{
      hips:{x:0,y:0,z:0},
      leftUpLeg:{x:0,y:0,z:0},
      rightUpLeg:{x:0,y:0,z:0},
      leftKnee:{x:0,y:0,z:0},
      rightKnee:{x:0,y:0,z:0},
      leftFoot:{x:0,y:0,z:0},
      rightFoot:{x:0,y:0,z:0},
      leftToe:{x:0,y:0,z:0},
      rightToe:{x:0,y:0,z:0}
    }
  },
  controls:{}
};


  return {
    FINAL_SECURITY_DIALOGUE_FACING,
    FINAL_ARREST_FLOW,
    getSecurityUnifiedTalkTarget,
    securityUnifiedGetDeg,
    refreshSecurityUnifiedTalkPanel,
    hideAllSecurityContextPanels,
    setFinalSecurityDialogueFacing,
    updateFinalSecurityDialogueFacing,
    SECURITY_POSE_EDITOR,
    SECURITY_FINAL_POSE_EDITOR,
    SECURITY_HEAD_SPEECH_STATE,
    SECURITY_FINGER_STATE,
    securityMirrorLeftFinalToRight,
    cacheSecurityFinalPoseDefaults,
    applyUserApprovedSecurityFinalPoseValues,
    captureSecurityFinalPoseTransition,
    getSecurityFinalTargetEuler,
    applySecurityFinalPose,
    refreshSecurityFinalPoseReadout,
    makeSecurityPanelCollapsible,
    ensureSecurityFinalPoseEditor,
    cacheSecurityPoseEditorBones,
    updateSecurityPoseEditor,
    getSecurityHeadSpeechState,
    animateSecurityHeadSpeech,
    cleanBoneName,
    getFingerSegment,
    isSecurityFingerBone,
    getSecurityFingerState,
    getMainFingerCurl,
    animateSecurityFingers,
    SECURITY_OLD_TALK_PANEL,
    initSecurityOldTalkPanelTargets,
    securityAddAgitationControls,
    refreshSecurityOldTalkPanel,
    ensureSecurityOldTalkPanel,
    updateSecurityOldTalkPanel,
    mirrorSecurityTalkBoneWorld,
    SECURITY_LOWER_BODY_EDITOR,
    SECURITY_TURN_POSE_EDITOR,
    cacheSecurityLowerBodyEditor,
    applySecurityLowerBodyEditor,
    refreshSecurityLowerBodyEditorReadout,
    ensureSecurityLowerBodyEditor,
    updateSecurityLowerBodyEditor
  };
}
