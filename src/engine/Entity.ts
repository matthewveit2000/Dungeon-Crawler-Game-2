import { Container, Sprite } from 'pixi.js';
import { createView, VisualSpec } from './View';
import { SpriteAnimator } from './SpriteAnimator';
import { AssetLoader } from './AssetLoader';

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

  public health = 0;
  public maxHealth = 0;

  protected animator?: SpriteAnimator;
  protected onDeath?: () => void;
  protected onDamaged?: (amount: number, currentHealth: number) => void;
  private destroyed = false;

  constructor(id: string, x = 0, y = 0, visual?: VisualSpec) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.width = visual?.width ?? 0;
    this.height = visual?.height ?? 0;
    this.sprite = visual ? createView(visual) : new Container();

    if (visual?.animations) {
      this.animator = new SpriteAnimator(visual.animations, visual.defaultAnimation);
      this.applyCurrentAnimationFrame();
    }

    this.syncView();
  }

  /** Switches to the named animation sequence. */
  public playAnimation(name: string): void {
    if (!this.animator) return;
    this.animator.play(name);
    this.applyCurrentAnimationFrame();
  }

  /** Currently playing animation name, or null. */
  public get currentAnimation(): string | null {
    return this.animator?.animationName ?? null;
  }

  /** Key of the active frame sprite, or null. */
  public get currentFrame(): string | null {
    return this.animator?.currentFrame ?? null;
  }

  /** Advances the active animation track by `dt` seconds and updates texture if changed. */
  protected updateAnimation(dt: number): void {
    if (!this.animator) return;
    const previous = this.animator.currentFrame;
    const next = this.animator.update(dt);
    if (next && next !== previous) {
      this.applyCurrentAnimationFrame();
    }
  }

  private applyCurrentAnimationFrame(): void {
    const frameKey = this.animator?.currentFrame;
    if (!frameKey) return;
    const texture = AssetLoader.get(frameKey);
    if (!texture) return;
    const spriteChild = this.sprite.children.find((c) => c instanceof Sprite) as Sprite | undefined;
    if (spriteChild) {
      spriteChild.texture = texture;
    }
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

  /** Whether the entity is alive (health > 0). */
  public get isAlive(): boolean {
    return this.health > 0;
  }

  /**
   * Applies damage to the entity, reducing health towards zero.
   * Dispatches onDamaged, and if health reaches zero, calls die().
   * Returns actual damage applied.
   */
  public takeDamage(amount: number): number {
    if (this.health <= 0 || amount <= 0) return 0;
    const actual = Math.min(this.health, amount);
    this.health -= actual;
    this.onDamaged?.(actual, this.health);
    if (this.health <= 0) {
      this.die();
    }
    return actual;
  }

  /**
   * Heals the entity up to its maximum health.
   * Returns actual amount healed.
   */
  public heal(amount: number): number {
    if (this.health <= 0 || amount <= 0) return 0;
    const actual = Math.min(this.maxHealth - this.health, amount);
    this.health += actual;
    return actual;
  }

  public setOnDeathCallback(callback: () => void): void {
    this.onDeath = callback;
  }

  public setOnDamagedCallback(callback: (amount: number, currentHealth: number) => void): void {
    this.onDamaged = callback;
  }

  /** Marks health as 0 and fires onDeath. */
  public die(): void {
    this.health = 0;
    this.onDeath?.();
  }

  /** Advances the entity by one fixed simulation step. */
  public abstract update(dt: number): void;
}
