import { Graphics } from 'pixi.js';
import { Entity } from '../engine/Entity';
import { InputManager } from '../engine/InputManager';
import { Level } from './Level';

export class Player extends Entity {
  private graphics: Graphics;
  private inputManager: InputManager;
  public speed: number = 200; // pixels per second
  private level?: Level;

  constructor(id: string, x: number, y: number, inputManager: InputManager, level?: Level) {
    super(id, x, y);
    this.level = level;
    this.width = 40;
    this.height = 40;
    this.inputManager = inputManager;

    this.graphics = new Graphics();
    this.graphics.rect(0, 0, this.width, this.height);
    this.graphics.fill(0x00ff00); // Green for player

    this.sprite.addChild(this.graphics);
    // Center the sprite's anchor so rotation/positioning works well
    this.sprite.pivot.x = this.width / 2;
    this.sprite.pivot.y = this.height / 2;

    // Set initial position
    this.sprite.x = this.x;
    this.sprite.y = this.y;
  }

  update(dt: number): void {
    const inputState = this.inputManager.getState();
    const keys = inputState.keys;

    let dx = 0;
    let dy = 0;

    if (keys['w']) dy -= 1;
    if (keys['s']) dy += 1;
    if (keys['a']) dx -= 1;
    if (keys['d']) dx += 1;

    if (dx !== 0 || dy !== 0) {
      // Normalize vector for diagonal movement
      const length = Math.sqrt(dx * dx + dy * dy);
      dx /= length;
      dy /= length;

      let nextX = this.x + dx * this.speed * dt;
      let nextY = this.y + dy * this.speed * dt;

      // Check collision on X axis
      if (this.level && this.level.isCollidingWithWall(nextX, this.y, this.width, this.height)) {
        nextX = this.x; // Block movement on X
      }

      // Check collision on Y axis
      if (this.level && this.level.isCollidingWithWall(this.x, nextY, this.width, this.height)) {
        nextY = this.y; // Block movement on Y
      }

      // Update logical position
      this.x = nextX;
      this.y = nextY;

      // Update visual position
      this.sprite.x = this.x;
      this.sprite.y = this.y;
    }
  }
}
