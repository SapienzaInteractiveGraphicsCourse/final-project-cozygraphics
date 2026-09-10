const fragmentHosts = [
  ["#gui-startup", "./src/ui/gui/startup.html"],
  ["#narration-dialogue", "./src/ui/narration/dialogue.html"],
  ["#quest-ui", "./src/ui/quest/quest.html"],
  ["#gui-hud", "./src/ui/gui/hud.html"],
  ["#gui-controls", "./src/ui/gui/controls.html"]
];

async function loadFragment(selector, url){
  const host = document.querySelector(selector);
  if(!host) throw new Error(`UI host not found: ${selector}`);

  const response = await fetch(url, { cache: "no-cache" });
  if(!response.ok){
    throw new Error(`Failed to load ${url}: HTTP ${response.status}`);
  }

  const html = await response.text();
  const template = document.createElement("template");
  template.innerHTML = html.trim();

  host.replaceWith(template.content);
}

try{
  for(const [selector, url] of fragmentHosts){
    await loadFragment(selector, url);
  }

  await import("./main.js");
}catch(error){
  console.error("UI bootstrap failed:", error);

  const pre = document.createElement("pre");
  pre.style.cssText =
    "position:fixed;left:12px;right:12px;bottom:12px;z-index:999999;" +
    "padding:12px;background:#240d0d;color:#ffbcbc;font:12px monospace;" +
    "white-space:pre-wrap;border:1px solid #7d2e2e";
  pre.textContent = "UI bootstrap failed\n" + String(error?.stack || error);
  document.body.appendChild(pre);
}
