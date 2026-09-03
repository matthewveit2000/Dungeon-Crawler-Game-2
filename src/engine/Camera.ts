import { Container } from 'pixi.js';
import { Entity } from './Entity';

export class Camera {
  private stage: Container;
  private target: Entity | null = null;
  private screenWidth: number;
  private screenHeight: number;
  private zoom: number;

  constructor(stage: Container, screenWidth: number, screenHeight: number, zoom: number = 1) {
    this.stage = stage;
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.validateZoom(zoom);
    this.zoom = zoom;
    this.applyZoom();
  }

  private validateZoom(zoom: number): void {
    if (!Number.isInteger(zoom) || zoom < 1) {
      throw new Error(`Camera zoom must be an integer >= 1, received ${zoom}`);
    }
  }

  private applyZoom(): void {
    this.stage.scale.set(this.zoom, this.zoom);
  }

  public getZoom(): number {
    return this.zoom;
  }

  public setZoom(zoom: number): void {
    this.validateZoom(zoom);
    this.zoom = zoom;
    this.applyZoom();
  }

  public setTarget(target: Entity): void {
    this.target = target;
    this.update();
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
    // Snap pivot coordinates to whole pixels so tile edges never sit on subpixel boundaries.
    this.stage.pivot.x = Math.round(targetX);
    this.stage.pivot.y = Math.round(targetY);

    // Position the stage such that the pivot (which is now exactly at the target's location)
    // is rendered precisely in the center of the screen.
    // Snap screen position to whole pixels to prevent shimmering on odd screen dimensions.
    this.stage.position.x = Math.round(this.screenWidth / 2);
    this.stage.position.y = Math.round(this.screenHeight / 2);
  }

  /** Converts screen pixel coordinates to world coordinates. */
  public screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: (screenX - this.screenWidth / 2) / this.zoom + this.stage.pivot.x,
      y: (screenY - this.screenHeight / 2) / this.zoom + this.stage.pivot.y,
    };
  }
}
