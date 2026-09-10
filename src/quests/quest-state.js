// Quest state/config extracted from core/main.js.
// Objects remain mutable references, so existing main.js logic keeps working.

export const QUEST={
  stage:"talk_police",
  dialogueActive:false,
  dialogueLines:[],
  dialogueIndex:0,
  dialogueSpeaker:"POLICE",
  dialogueDone:null
};

export const QUEST_TASKS={
  talk_police:"Talk to the Police",
  search_clues:"Investigate the Casino",
  return_wallet:"Bring the wallet to the Police",
  find_suspicious:"Go to the garden and investigate",
  call_security:"Call Security with the radio",
  arrest_in_progress:"Police arrest in progress",
  game_complete:"MYSTERY SOLVED"
};

export const TASK_BOUNDARY={
  marginBeforeCorner:7.0,
  gate:null,
  gateReady:false,
  lastWarning:0
};
