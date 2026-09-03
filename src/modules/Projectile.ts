import { Entity } from '../engine/Entity';
import { Level } from './Level';

export interface ProjectileOptions {
  dirX: number;
  dirY: number;
  speed: number;
  damage: number;
  maxRange: number;
  size?: number;
  color?: number;
  level?: Level;
  ownerId?: string;
}

/**
 * Projectile — a fast-moving physical or magical entity in the dungeon.
 *
 * Tier 2. Extends Entity without importing PixiJS directly.
 * Moves linearly, damages intersecting entities, and dissipates on wall contact.
 */
export class Projectile extends Entity {
  public readonly dirX: number;
  public readonly dirY: number;
  public readonly speed: number;
  public readonly damage: number;
  public readonly maxRange: number;
  public readonly ownerId?: string;

  private distanceTraveled = 0;
  private readonly level?: Level;

  constructor(id: string, x: number, y: number, options: ProjectileOptions) {
    const size = options.size ?? 6;
    const color = options.color ?? 0xffee55;

    // Normalize direction vector
    const len = Math.hypot(options.dirX, options.dirY);
    const dirX = len > 0 ? options.dirX / len : 1;
    const dirY = len > 0 ? options.dirY / len : 0;

    super(id, x, y, {
      width: size,
      height: size,
      color,
    });

    this.dirX = dirX;
    this.dirY = dirY;
    this.speed = options.speed;
    this.damage = options.damage;
    this.maxRange = options.maxRange;
    this.level = options.level;
    this.ownerId = options.ownerId;
  }

  /**
   * Tests AABB intersection with an entity and applies damage on contact.
   * Destroys the projectile on hit.
   */
  public checkCollisionWith(target: Entity): boolean {
    if (this.isDestroyed || !target.isAlive) return false;
    if (this.ownerId && target.id === this.ownerId) return false;

    const halfW = (this.width + target.width) / 2;
    const halfH = (this.height + target.height) / 2;

    const overlaps = Math.abs(this.x - target.x) <= halfW && Math.abs(this.y - target.y) <= halfH;

    if (overlaps) {
      target.takeDamage(this.damage);
      this.destroy();
      return true;
    }

    return false;
  }

  public override update(dt: number): void {
    if (this.isDestroyed) return;

    const moveX = this.dirX * this.speed * dt;
    const moveY = this.dirY * this.speed * dt;
    const stepDist = Math.hypot(moveX, moveY);

    this.x += moveX;
    this.y += moveY;
    this.distanceTraveled += stepDist;

    if (this.distanceTraveled >= this.maxRange) {
      this.destroy();
      return;
    }

    if (this.level && this.level.isCollidingWithWall(this.x, this.y, this.width, this.height)) {
      this.destroy();
      return;
    }

    this.syncView();
  }
}
