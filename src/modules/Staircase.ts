import { Graphics } from 'pixi.js';
import { Entity } from '../engine/Entity';
import interactables from '../packs/Interactables.json';

export class Staircase extends Entity {
  private graphics: Graphics;

  constructor(id: string, x: number, y: number) {
    super(id, x, y);

    const config = interactables.staircase;
    this.width = config.width;
    this.height = config.height;

    this.graphics = new Graphics();
    this.graphics.rect(0, 0, this.width, this.height);
    this.graphics.fill(Number(config.color)); // Blue for staircase

    this.sprite.addChild(this.graphics);
    // Center the sprite's anchor
    this.sprite.pivot.x = this.width / 2;
    this.sprite.pivot.y = this.height / 2;

    // Set initial position
    this.sprite.x = this.x;
    this.sprite.y = this.y;
  }

  update(_dt: number): void {
    // Static entity, no physics update needed
  }
}
