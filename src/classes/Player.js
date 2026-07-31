import { Character } from "./Character.js";

export class Player extends Character {
  constructor(config, context) {
    super({ ...config, role: "player" }, context);
  }

  getMoveSpeed() {
    return this.speed || 0.08;
  }
}
