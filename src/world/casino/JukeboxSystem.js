// JukeboxSystem.js
// Casino jukebox logic. Camera intentionally remains in main.js.

export const JUKEBOX_AUDIO_RUNTIME={
  tracks:[
    {
      id:"epic-ballad",
      title:"Epic Ballad",
      file:"./audio/Epic Ballad.mp3",
      duration:"4:30"
    },
    {
      id:"metal-drum",
      title:"Metal Drum",
      file:"./audio/Metal  Drum.mp3",
      duration:"4:55"
    }
  ],
  audio:null,
  currentTrack:null,
  menuOpen:false,
  playToken:0,
  loadingTrackId:null,
  maxVolume:.72,
  nearDistance:3.0,
  farDistance:18.0,
  prompt:null,
  panel:null,
  status:null
};

export function createJukeboxSystem(ctx){

function ensureJukeboxAudioElement(){
  if(JUKEBOX_AUDIO_RUNTIME.audio) return JUKEBOX_AUDIO_RUNTIME.audio;

  const audio=new Audio();
  audio.preload="auto";
  audio.loop=true;
  audio.volume=0;

  audio.addEventListener("error",()=>{
    const err=audio.error;

    if(!err){
      updateJukeboxMenuStatus("AUDIO UNAVAILABLE");
      return;
    }

    if(err.code===MediaError.MEDIA_ERR_ABORTED){
      return;
    }

    updateJukeboxMenuStatus("AUDIO FILE COULD NOT BE LOADED");
  });

  audio.addEventListener("playing",()=>{
    const t=JUKEBOX_AUDIO_RUNTIME.currentTrack;
    JUKEBOX_AUDIO_RUNTIME.loadingTrackId=null;
    updateJukeboxMenuStatus(
      t ? `NOW PLAYING · ${t.title}` : "NOW PLAYING"
    );
  });

  audio.addEventListener("pause",()=>{
    if(!JUKEBOX_AUDIO_RUNTIME.menuOpen){
      const playing=
        JUKEBOX_AUDIO_RUNTIME.currentTrack &&
        !audio.paused;

      if(!playing) setJukeboxPower(false);
    }
  });

  JUKEBOX_AUDIO_RUNTIME.audio=audio;
  return audio;
}

function updateJukeboxMenuStatus(message){
  const status=JUKEBOX_AUDIO_RUNTIME.status;
  if(status) status.textContent=message||"CHOOSE A SONG";
}

function stopJukeboxMusic(keepLights=true){
  const audio=JUKEBOX_AUDIO_RUNTIME.audio;

  JUKEBOX_AUDIO_RUNTIME.playToken++;
  JUKEBOX_AUDIO_RUNTIME.loadingTrackId=null;

  if(audio){
    audio.pause();
    try{
      audio.currentTime=0;
    }catch(_){}
  }

  JUKEBOX_AUDIO_RUNTIME.currentTrack=null;

  updateJukeboxMenuStatus("MUSIC STOPPED");

  if(!keepLights){
    setJukeboxPower(false);
  }

  refreshJukeboxTrackButtons();
}

async function playJukeboxTrack(trackId){
  const track=
    JUKEBOX_AUDIO_RUNTIME.tracks.find(t=>t.id===trackId);

  if(!track) return;

  const audio=ensureJukeboxAudioElement();

  if(
    JUKEBOX_AUDIO_RUNTIME.currentTrack?.id===track.id &&
    !audio.paused &&
    !audio.ended
  ){
    updateJukeboxMenuStatus(`NOW PLAYING · ${track.title}`);
    return;
  }

  const token=++JUKEBOX_AUDIO_RUNTIME.playToken;

  JUKEBOX_AUDIO_RUNTIME.loadingTrackId=track.id;
  JUKEBOX_AUDIO_RUNTIME.currentTrack=track;

  setJukeboxPower(true);
  updateJukeboxMenuStatus(`LOADING · ${track.title}`);

  const wantedSrc=new URL(track.file,location.href).href;
  const currentSrc=audio.currentSrc || audio.src || "";

  if(currentSrc!==wantedSrc){
    audio.pause();

    audio.src=track.file;
  }

  try{
    const playPromise=audio.play();

    if(playPromise && typeof playPromise.then==="function"){
      await playPromise;
    }

    if(token!==JUKEBOX_AUDIO_RUNTIME.playToken){
      return;
    }

    JUKEBOX_AUDIO_RUNTIME.loadingTrackId=null;
    updateJukeboxMenuStatus(`NOW PLAYING · ${track.title}`);
  }catch(err){
    if(token!==JUKEBOX_AUDIO_RUNTIME.playToken){
      return;
    }

    const name=String(err?.name||"");

    if(
      name==="AbortError" ||
      name==="NotAllowedError" && document.visibilityState==="hidden"
    ){
      return;
    }

    console.error("Jukebox audio play error",err);

    JUKEBOX_AUDIO_RUNTIME.loadingTrackId=null;
    updateJukeboxMenuStatus(
      "AUDIO COULD NOT START · CLICK THE SONG AGAIN"
    );
  }

  refreshJukeboxTrackButtons();
}

function refreshJukeboxTrackButtons(){
  document.querySelectorAll("[data-jukebox-track]").forEach(btn=>{
    const active=
      JUKEBOX_AUDIO_RUNTIME.currentTrack?.id===btn.dataset.jukeboxTrack &&
      !JUKEBOX_AUDIO_RUNTIME.audio?.paused;
    btn.style.borderColor=active?"#e5be82":"rgba(180,135,85,.45)";
    btn.style.background=active?"#8a5d31":"#5b3d27";
    btn.style.boxShadow=active?"0 0 0 1px rgba(229,190,130,.35) inset":"none";
  });
}

function setJukeboxMenuOpen(open){
  JUKEBOX_AUDIO_RUNTIME.menuOpen=!!open;
  const panel=JUKEBOX_AUDIO_RUNTIME.panel;
  if(panel) panel.style.display=open?"block":"none";
  if(open){
    setJukeboxPower(true);
    refreshJukeboxTrackButtons();
    const current=JUKEBOX_AUDIO_RUNTIME.currentTrack;
    const audio=JUKEBOX_AUDIO_RUNTIME.audio;
    const playing=!!current && !!audio && !audio.paused;
    updateJukeboxMenuStatus(
      playing
        ? `NOW PLAYING · ${current.title}`
        : "CHOOSE A SONG"
    );
    return;
  }
  const audio=JUKEBOX_AUDIO_RUNTIME.audio;
  const musicPlaying=
    !!JUKEBOX_AUDIO_RUNTIME.currentTrack &&
    !!audio &&
    !audio.paused;
  if(!musicPlaying){
    setJukeboxPower(false);
  }
}

function initJukeboxMusicMenu(){
  if(document.getElementById("jukeboxMusicMenu")) return;
  const prompt=ctx.uiNode("div",{
    id:"jukeboxWorldPrompt",
    text:"E · USE JUKEBOX",
    className:"interactionPromptUnified",
    style:"display:none"
  });
  prompt.classList.add("interactionPromptUnified");
  const panel=ctx.uiNode("div",{
    id:"jukeboxMusicMenu",
    style:"display:none;position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:13130;width:330px;padding:12px;border:1px solid #8f6946;border-radius:9px;background:#49311f;color:#fff4df;font:12px Arial;box-shadow:0 10px 26px rgba(0,0,0,.38)"
  });
  const header=ctx.uiNode("div",{
    style:"display:flex;align-items:center;justify-content:space-between;margin-bottom:8px"
  });
  header.append(
    ctx.uiNode("div",{
      text:"JUKEBOX",
      style:"font:900 14px Arial;letter-spacing:.06em;color:#efc58d"
    }),
    ctx.uiNode("button",{
      id:"jukeboxMenuClose",
      text:"×",
      style:"width:30px;height:30px;border-radius:7px;border:1px solid rgba(230,196,148,.32);background:#4e321f;color:#f6ddba;font:900 18px Arial;cursor:pointer"
    })
  );
  const status=ctx.uiNode("div",{
    id:"jukeboxMenuStatus",
    text:"CHOOSE A SONG",
    style:"margin:7px 0 9px;padding:6px 8px;border-radius:5px;background:rgba(28,17,10,.26);color:#e8c99c;font:900 10px Arial;text-align:center"
  });
  const list=ctx.uiNode("div",{
    style:"display:grid;gap:8px"
  });
  JUKEBOX_AUDIO_RUNTIME.tracks.forEach((track,index)=>{
    const btn=ctx.uiNode("button",{
      attrs:{"data-jukebox-track":track.id},
      style:"display:grid;grid-template-columns:28px 1fr auto;gap:7px;align-items:center;width:100%;padding:8px;border:1px solid rgba(180,135,85,.34);border-radius:6px;background:#583b26;color:#fff0da;text-align:left;cursor:pointer"
    });
    btn.append(
      ctx.uiNode("span",{
        text:String(index+1).padStart(2,"0"),
        style:"font:900 13px monospace;color:#e2b873"
      }),
      ctx.uiNode("span",{
        text:track.title,
        style:"font:900 12px Arial;letter-spacing:.04em"
      }),
      ctx.uiNode("span",{
        text:track.duration,
        style:"font:10px monospace;color:#c9ab82"
      })
    );
    btn.onclick=()=>playJukeboxTrack(track.id);
    list.append(btn);
  });
  const actions=ctx.uiNode("div",{
    style:"display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px"
  });
  const stop=ctx.uiNode("button",{
    text:"STOP MUSIC",
    style:"padding:9px;border:1px solid rgba(220,178,119,.38);border-radius:8px;background:#563820;color:#f6dfbd;font-weight:900;cursor:pointer"
  });
  const off=ctx.uiNode("button",{
    text:"TURN OFF",
    style:"padding:9px;border:1px solid rgba(220,178,119,.38);border-radius:8px;background:#352419;color:#f6dfbd;font-weight:900;cursor:pointer"
  });
  stop.onclick=()=>stopJukeboxMusic(true);
  off.onclick=()=>{
    stopJukeboxMusic(false);
    setJukeboxMenuOpen(false);
  };
  actions.append(stop,off);
  panel.append(
    header,
    ctx.uiNode("div",{
      text:"CHOOSE A SONG",
      style:"color:#cda46f;font:900 10px Arial;letter-spacing:.13em;margin-bottom:7px"
    }),
    status,
    list,
    actions,
  );
  document.body.append(prompt,panel);
  document.getElementById("jukeboxMenuClose").onclick=()=>{
    setJukeboxMenuOpen(false);
  };
  panel.addEventListener("pointerdown",e=>e.stopPropagation());
  panel.addEventListener("click",e=>e.stopPropagation());
  JUKEBOX_AUDIO_RUNTIME.prompt=prompt;
  JUKEBOX_AUDIO_RUNTIME.panel=panel;
  JUKEBOX_AUDIO_RUNTIME.status=status;
}

function updateJukeboxInteraction(){
  if(!JUKEBOX_AUDIO_RUNTIME.prompt) return;
  const near=casinoJukeboxNear();
  JUKEBOX_AUDIO_RUNTIME.prompt.style.display=
    near && !JUKEBOX_AUDIO_RUNTIME.menuOpen
      ? "block"
      : "none";
  if(!near && JUKEBOX_AUDIO_RUNTIME.menuOpen){
    setJukeboxMenuOpen(false);
  }
  const audio=JUKEBOX_AUDIO_RUNTIME.audio;
  if(!audio || audio.paused || !ctx.player?.root || !ctx.CASINO_MEDIA_RUNTIME.jukebox){
    return;
  }
  const a=new ctx.THREE.Vector3();
  const b=new ctx.THREE.Vector3();
  ctx.CASINO_MEDIA_RUNTIME.jukebox.getWorldPosition(a);
  ctx.player.root.getWorldPosition(b);
  const dist=a.distanceTo(b);
  const rt=JUKEBOX_AUDIO_RUNTIME;
  let volume=0;
  if(dist<=rt.nearDistance){
    volume=rt.maxVolume;
  }else if(dist<rt.farDistance){
    const t=(dist-rt.nearDistance)/(rt.farDistance-rt.nearDistance);
    volume=rt.maxVolume*(1-ctx.THREE.MathUtils.smoothstep(t,0,1));
  }
  audio.volume=ctx.THREE.MathUtils.clamp(volume,0,1);
}

function casinoJukeboxNear(){
  if(!ctx.CASINO_MEDIA_RUNTIME.jukebox || !ctx.player?.root || ctx.activeWorldZone!=="leftRoom") return false;
  const a=new ctx.THREE.Vector3(), b=new ctx.THREE.Vector3();
  ctx.CASINO_MEDIA_RUNTIME.jukebox.getWorldPosition(a);
  ctx.player.root.getWorldPosition(b);
  return a.distanceTo(b)<=3.2;
}

function setJukeboxPower(on){
  ctx.CASINO_MEDIA_RUNTIME.jukeboxOn=!!on;
  const palette=[0xff356d,0x38e8ff,0xffd23f,0xb96cff];
  ctx.CASINO_MEDIA_RUNTIME.jukeboxLightMaterials.forEach((mat,i)=>{
    mat.emissive.setHex(on?palette[i%palette.length]:0x000000);
    mat.emissiveIntensity=on?2.1:0;
    mat.needsUpdate=true;
  });
  const btn=document.getElementById("jukeboxPowerButton");
  if(btn) btn.textContent=`JUKEBOX ${on?"ON":"OFF"} · CLICK TO TOGGLE`;
}

return {
  ensureJukeboxAudioElement,
  updateJukeboxMenuStatus,
  stopJukeboxMusic,
  playJukeboxTrack,
  refreshJukeboxTrackButtons,
  setJukeboxMenuOpen,
  initJukeboxMusicMenu,
  updateJukeboxInteraction,
  casinoJukeboxNear,
  setJukeboxPower
};
}
