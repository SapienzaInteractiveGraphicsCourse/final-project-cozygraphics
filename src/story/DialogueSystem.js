// DialogueSystem.js
// Basic dialogue UI/runtime extracted from core/main.js.

export const GLOBAL_DIALOGUE_LOCK = {
  active:false,
  npc:null
};

export function formatDialogueName(name){
  if(!name) return "UNKNOWN";
  return String(name)
    .replace(/([a-z])([A-Z])/g,"$1 $2")
    .replace(/_/g," ")
    .toUpperCase();
}

export function getDialogueHintSafe(){
  return document.getElementById("dialogueHint") || null;
}

export function showDialogueUI({
  dialogue,
  dialogueName,
  dialogueBody,
  currentTarget,
  text
}){
  dialogue.classList.remove("warningMode");
  const speaker=GLOBAL_DIALOGUE_LOCK.npc?.name || currentTarget?.name || "NPC";
  if(dialogueName) dialogueName.textContent=formatDialogueName(speaker);
  if(dialogueBody) dialogueBody.textContent=text;

  const dialogueHint=getDialogueHintSafe();
  if(dialogueHint){
    dialogueHint.textContent="PRESS E · END CONVERSATION";
    dialogueHint.style.display="block";
  }
  dialogue.style.display="block";
}

export function hideDialogueUI({
  dialogue,
  dialogueBody
}){
  dialogue.classList.remove("warningMode");
  dialogue.style.display="none";
  if(dialogueBody) dialogueBody.textContent="";

  const dialogueHint=getDialogueHintSafe();
  if(dialogueHint) dialogueHint.style.display="none";
}
