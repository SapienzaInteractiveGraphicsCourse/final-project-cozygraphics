// ================= CHARACTER CONFIG =================
// This file contains data only.
// Character logic lives in ../classes/.

export const CHARACTER_CONFIGS = {
  player: {
    id: "player",
    name: "player",
    role: "player",
    file: "../assets/models/player.glb",
    position: { x: 0, y: 0.1, z: 15.5 },
    height: 4.0,
    rotationY: Math.PI,
    speed: 0.08
  },

  securityMan: {
    id: "securityMan",
    name: "securityMan",
    role: "npc",
    file: "../assets/models/securityMan.glb",
    position: { x: -4.0, y: 0.15, z: 6.0 },
    height: 4.0,
    rotationY: -0.5974,
    zone: "outside",
    style: "security",
    dialogue: "Security: Hey, stop for a moment. This area is monitored. Tell me what you are looking for."
  },

  toxicMan: {
    id: "toxicMan",
    name: "toxicMan",
    role: "npc",
    file: "../assets/models/toxicMan.glb",
    position: { x: -24.0, y: 0, z: -20.5 },
    height: 4.0,
    rotationY: 0,
    zone: "leftRoom",
    style: "toxic",
    dialogue: "ToxicMan: Don't get too close. I'm just watching."
  },

  child: {
    id: "child",
    name: "child",
    role: "npc",
    file: "../assets/models/child.glb",
    position: { x: -7.800, y: 0.110, z: -5.9 },
    height: 2.8,
    rotationY: 0,
    zone: "leftRoom",
    style: "child",
    dialogue: "Child: Hi! Have you seen the bartender? He says strange things happen here."
  },

  boyListeningMusic: {
    id: "boyListeningMusic",
    name: "boyListeningMusic",
    role: "npc",
    file: "../assets/models/boyListeningMusic.glb",
    position: { x: 18.0, y: 0, z: -20.0 },
    height: 3.8,
    rotationY: 0,
    zone: "rightRoom",
    style: "music",
    dialogue: "Boy: Wait, I'll turn the music down... yes, I can hear you now. What's going on?"
  }
};

export const NPC_ORDER = [
  "securityMan",
  "toxicMan",
  "child",
  "boyListeningMusic"
];
