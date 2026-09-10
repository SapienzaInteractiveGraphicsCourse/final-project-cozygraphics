(() => {
  const tick=()=>{
    const hud=document.getElementById("playerPositionHud");
    try{
      if(hud && window.__PLAYER_POSITION_READER__){
        const p=window.__PLAYER_POSITION_READER__();
        if(p){
          }
      }
    }catch(_){}
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();


/* ---- GUI runtime block ---- */


(() => {
  const defaults={scaleX:1.00,scaleY:1.01,scaleZ:0.91};
  window.CLAW_MACHINE_TUNING=window.CLAW_MACHINE_TUNING||{...defaults};

  const bind=()=>{
    document.querySelectorAll("[data-clawmachine]").forEach(input=>{
      if(input.dataset.bound)return;
      input.dataset.bound="1";
      const key=input.dataset.clawmachine;
      input.value=window.CLAW_MACHINE_TUNING[key];
      const paint=()=>{
        document.getElementById("clawMachineVal_"+key).textContent=Number(input.value).toFixed(2)+"×";
      };
      paint();
      input.addEventListener("input",()=>{
        window.CLAW_MACHINE_TUNING[key]=Number(input.value);
        paint();
      });
    });

    document.getElementById("clawMachineReset")?.addEventListener("click",()=>{
      Object.assign(window.CLAW_MACHINE_TUNING,defaults);
      document.querySelectorAll("[data-clawmachine]").forEach(input=>{
        input.value=defaults[input.dataset.clawmachine];
        input.dispatchEvent(new Event("input",{bubbles:true}));
      });
    });

    document.getElementById("clawMachinePrint")?.addEventListener("click",()=>{
      console.log("CLAW_MACHINE_TUNING =",JSON.stringify(window.CLAW_MACHINE_TUNING,null,2));
    });

    document.getElementById("clawMachineClose")?.addEventListener("click",()=>{
      document.getElementById("clawMachineTuner")?.classList.remove("open");
    });
  };

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bind,{once:true});
  else bind();
})();
