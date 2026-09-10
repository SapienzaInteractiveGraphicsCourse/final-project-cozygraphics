// StartScreen.js
// Start screen state and behavior extracted from core/main.js.

export function createStartScreenSystem(deps){
  const {
    THREE,
    GAME_SETTINGS,
    getLoadingScreen,
    getSetDifficulty,
    applyDifficultyGuidance,
    applyStartPreviewOutfit,
    applyPlayerOutfitPreset,
    setLoadingProgress,
    isModuleInitializationComplete,
    finishSceneLoading
  } = deps;

  const START_GATE={accepted:false};
  const START_PLAYER_PREVIEW={
    renderer:null,
    scene:null,
    camera:null,
    root:null,
    mixer:null,
    raf:0,
    clock:new THREE.Clock(),
    loaded:false
  };

  function collectGLBStrings(value,out=new Set(),depth=0){
    if(depth>5 || value==null) return out;
    if(typeof value==="string"){
      if(/\.glb(?:$|\?)/i.test(value)) out.add(value);
      return out;
    }
    if(Array.isArray(value)){
      for(const v of value) collectGLBStrings(v,out,depth+1);
      return out;
    }
    if(typeof value==="object"){
      for(const v of Object.values(value)){
        collectGLBStrings(v,out,depth+1);
      }
    }
    return out;
  }

  function disposeStartPlayerPreview(){
    if(START_PLAYER_PREVIEW.raf){
      cancelAnimationFrame(START_PLAYER_PREVIEW.raf);
      START_PLAYER_PREVIEW.raf=0;
    }
    START_PLAYER_PREVIEW.mixer?.stopAllAction?.();
  }

  function refreshStartSummary(){
    const difficulty=String(GAME_SETTINGS?.difficulty||"easy");
    const dRead=document.getElementById("startDifficultyRead");
    if(dRead){
      dRead.textContent=
        difficulty==="intermediate"
          ?"Intermediate"
          :difficulty==="hard"
            ?"Hard"
            :"Easy";
    }

    const outfit=document.getElementById("startOutfit");
    const outfitRead=document.getElementById("startOutfitRead");
    if(outfitRead && outfit){
      outfitRead.textContent=
        outfit.selectedOptions?.[0]?.textContent ||
        "Original Outfit";
    }
  }

  function initGameStartScreen(){
    if(initGameStartScreen.done) return;
    initGameStartScreen.done=true;

    document.body.classList.remove("game-ready");
    document.body.classList.add("start-menu-active");
    getLoadingScreen()?.classList.add("hidden");

    document.querySelectorAll("[data-start-difficulty]").forEach(btn=>{
      btn.onclick=()=>{
        document
          .querySelectorAll("[data-start-difficulty]")
          .forEach(x=>x.classList.remove("selected"));
        btn.classList.add("selected");

        const value=btn.dataset.startDifficulty||"easy";
        GAME_SETTINGS.difficulty=value;

        const setDifficulty=getSetDifficulty();
        if(setDifficulty) setDifficulty.value=value;

        applyDifficultyGuidance();
        refreshStartSummary();
      };
    });

    const outfit=document.getElementById("startOutfit");
    outfit?.addEventListener("change",()=>{
      GAME_SETTINGS.outfit=outfit.value;
      const setOutfit=document.getElementById("setOutfit");
      if(setOutfit) setOutfit.value=outfit.value;
      applyStartPreviewOutfit();
      applyPlayerOutfitPreset();
      refreshStartSummary();
    });

    refreshStartSummary();

    const play=document.getElementById("startPlay");
    if(play){
      play.onclick=()=>{
        if(START_GATE.accepted) return;
        START_GATE.accepted=true;

        disposeStartPlayerPreview();
        document.body.classList.remove("start-menu-active");
        document.body.classList.add("loading-active");
        document.getElementById("gameStartScreen")?.classList.add("hidden");
        getLoadingScreen()?.classList.remove("hidden");

        setLoadingProgress(0,"Loading assets");
        if(isModuleInitializationComplete()){
          finishSceneLoading();
        }
      };
    }
  }

  return {
    START_GATE,
    START_PLAYER_PREVIEW,
    collectGLBStrings,
    disposeStartPlayerPreview,
    refreshStartSummary,
    initGameStartScreen
  };
}
