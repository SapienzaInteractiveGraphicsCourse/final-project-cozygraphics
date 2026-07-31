// ================= CONFIG PERSONAGGI =================
// Questo file contiene solo dati.
// La logica dei personaggi sta in ../classes/.

export const CHARACTER_CONFIGS = {
  player: {
    id: "player",
    name: "player",
    role: "player",
    file: "../assets/models/player.glb",
    position: { x: 0, z: 15.5 },
    height: 4.0,
    rotationY: Math.PI,
    speed: 0.08
  },

  securityMan: {
    id: "securityMan",
    name: "securityMan",
    role: "npc",
    file: "../assets/models/securityMan.glb",
    position: { x: -4.0, z: 6.0 },
    height: 4.0,
    rotationY: Math.PI,
    zone: "outside",
    style: "security",
    dialogue: "Security: Ehi, fermo un attimo. Questa zona è controllata. Dimmi cosa stai cercando."
  },

  toxicMan: {
    id: "toxicMan",
    name: "toxicMan",
    role: "npc",
    file: "../assets/models/toxicMan.glb",
    position: { x: -24.0, z: -20.5 },
    height: 4.0,
    rotationY: 0,
    zone: "leftRoom",
    style: "toxic",
    dialogue: "ToxicMan: Non avvicinarti troppo. Sto solo osservando."
  },

  child: {
    id: "child",
    name: "child",
    role: "npc",
    file: "../assets/models/child.glb",
    position: { x: -11.5, z: -19.0 },
    height: 2.8,
    rotationY: 0,
    zone: "leftRoom",
    style: "child",
    dialogue: "Bambino: Ciao! Hai visto il barista? Dice che qui succedono cose strane."
  },

  boyListeningMusic: {
    id: "boyListeningMusic",
    name: "boyListeningMusic",
    role: "npc",
    file: "../assets/models/boyListeningMusic.glb",
    position: { x: 18.0, z: -20.0 },
    height: 3.8,
    rotationY: 0,
    zone: "rightRoom",
    style: "music",
    dialogue: "Ragazzo: Aspetta, abbasso la musica... sì, ora ti sento. Che succede?"
  }
};

export const NPC_ORDER = [
  "securityMan",
  "toxicMan",
  "child",
  "boyListeningMusic"
];
