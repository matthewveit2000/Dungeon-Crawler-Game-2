import { Container } from 'pixi.js';
import { createRectView, ShapeSpec } from './View';

/**
 * Entity — the base class for everything that lives in the world.
 *
 * Tier 1. Owns the logical position, the collision box and the display object,
 * and guarantees the three stay in step: `syncView()` is called at the end of
 * every update so code that repositions an entity directly (teleports, spawns,
 * knockback) never has to remember to move the sprite as well.
 */
export abstract class Entity {
  public id: string;
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public sprite: Container;

  private destroyed = false;

  constructor(id: string, x = 0, y = 0, shape?: ShapeSpec) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.width = shape?.width ?? 0;
    this.height = shape?.height ?? 0;
    this.sprite = shape ? createRectView(shape) : new Container();
    this.syncView();
  }

  /** True once `destroy()` has run; the entity must not be updated again. */
  public get isDestroyed(): boolean {
    return this.destroyed;
  }

  /**
   * Copies the logical position onto the display object. Safe to call on a
   * destroyed entity, which can happen when an entity is torn down partway
   * through the update that triggered the teardown.
   */
  public syncView(): void {
    if (this.destroyed) return;
    this.sprite.x = this.x;
    this.sprite.y = this.y;
  }

  /**
   * Releases the display object and its GPU resources. Idempotent, so an entity
   * removed twice does not throw.
   */
  public destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.sprite.destroy({ children: true });
  }

  /** Advances the entity by one fixed simulation step. */
  public abstract update(dt: number): void;
}
