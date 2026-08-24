import { Container } from 'pixi.js';
import { Entity } from './Entity';

export class Camera {
  private stage: Container;
  private target: Entity | null = null;
  private screenWidth: number;
  private screenHeight: number;

  constructor(stage: Container, screenWidth: number, screenHeight: number) {
    this.stage = stage;
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
  }

  public setTarget(target: Entity): void {
    this.target = target;
  }

  public resize(screenWidth: number, screenHeight: number): void {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
  }

  public update(): void {
    if (!this.target) return;

    // The target's logical coordinates (where it is in the world).
    const targetX = this.target.x;
    const targetY = this.target.y;

    // Track the target by adjusting the stage's pivot.
    // Setting the pivot to the target's position achieves the exact inverse movement.
    this.stage.pivot.x = targetX;
    this.stage.pivot.y = targetY;

    // Position the stage such that the pivot (which is now exactly at the target's location)
    // is rendered precisely in the center of the screen.
    this.stage.position.x = this.screenWidth / 2;
    this.stage.position.y = this.screenHeight / 2;
  }
}
