async function loadHtmlFragment(relativeUrl){
  const url = new URL(relativeUrl, import.meta.url);
  const response = await fetch(url);
  if(!response.ok){
    throw new Error(`UI fragment load failed: ${response.status} ${url.href}`);
  }
  return response.text();
}

async function loadClassicScript(relativeUrl){
  const url = new URL(relativeUrl, import.meta.url).href;
  await new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = url;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

const UI_FRAGMENTS = [
  "./debug/turn-controls.html",
  "../story/reception.html",
  "./start-screen.html",
  "./loading-screen.html",
  "../story/narration.html",
  "../quests/quest-ui.html",
  "./settings.html",
  "./inventory.html",
  "./world-hud.html",
  "./minimap.html",
  "./controls.html"
];

async function mountUi(){
  for(const fragment of UI_FRAGMENTS){
    const markup = await loadHtmlFragment(fragment);
    document.body.insertAdjacentHTML("beforeend", markup);
  }

  // Preserve the original execution order:
  // all GUI DOM -> old pre-main GUI scripts -> main.js -> old post-main GUI scripts.
  await loadClassicScript("./gui-pre.js");
  await import("../core/main.js");
  await loadClassicScript("./gui-post.js");
}

mountUi().catch(error => {
  console.error("UI bootstrap failed:", error);
});
