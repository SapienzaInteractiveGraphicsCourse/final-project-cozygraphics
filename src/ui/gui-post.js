(()=>{
  const hidePanel=(el)=>{
    if(!(el instanceof HTMLElement)) return;
    const id=(el.id||"").toLowerCase();
    const allowedSecurityPanel =
      id==="securityoldtalkpanel" ||
      id==="securityfinalposeeditor" ||
      id==="securitytalk2panel" ||
      id==="moonlightcoloreditor" ||
      id==="securityturnposeeditor" ||
      id==="securityturntuner" ||
      id==="securitylowerbodyeditor" ||
      id==="securityunifiedtalkpanel" ||
      id==="finalscenelayoutdebugpanel" ||
      id==="finalpositioneditor" ||
      id==="casinocharacteryeditor";

    const looksLikeEditor =
      el.dataset?.keepVisible!=="true" &&
      !allowedSecurityPanel &&
      (
        (id!=="securityunifiedtalkpanel" && id.includes("security") && id.includes("panel")) ||
        (id.includes("arrest") && id.includes("panel")) ||
        (id.includes("handcuff") && id.includes("panel")) ||
        (id.includes("pose") && id.includes("editor"))
      );

    if(looksLikeEditor){
      el.style.setProperty("display","none","important");
      el.style.setProperty("visibility","hidden","important");
      el.style.setProperty("pointer-events","none","important");
    }
  };

  addEventListener("DOMContentLoaded",()=>{
    document.querySelectorAll("[id]").forEach(hidePanel);

    new MutationObserver(records=>{
      for(const record of records){
        for(const node of record.addedNodes){
          if(node instanceof HTMLElement){
            hidePanel(node);
            node.querySelectorAll?.("[id]").forEach(hidePanel);
          }
        }
      }
    }).observe(document.body,{childList:true,subtree:true});
  });
})();
