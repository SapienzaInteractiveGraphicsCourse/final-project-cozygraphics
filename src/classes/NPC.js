import { Character } from "./Character.js";

export class NPC extends Character {
  constructor(config, context) {
    super({ ...config, role: "npc" }, context);
  }

  startDialogue() {
    this.state = "talk";
    this.timer = 0;
    this.context.dialogueSystem.show(this.dialogue);
  }

  stopDialogue() {
    this.state = "idle";
    this.context.dialogueSystem.hide();
  }
}
