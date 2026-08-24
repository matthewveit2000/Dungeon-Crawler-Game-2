import { Graphics } from 'pixi.js';
import { Entity } from '../engine/Entity';

export class TestSquare extends Entity {
  private graphics: Graphics;

  constructor(id: string, x: number, y: number, size: number = 50) {
    super(id, x, y);
    this.width = size;
    this.height = size;

    this.graphics = new Graphics();
    this.graphics.beginFill(0xff0000);
    this.graphics.drawRect(0, 0, size, size);
    this.graphics.endFill();

    this.sprite.addChild(this.graphics);
    this.sprite.x = x;
    this.sprite.y = y;
  }

  update(_dt: number): void {
    // Basic update logic to prove it runs; maybe spin it slowly
    this.sprite.rotation += 0.01;
  }
}
