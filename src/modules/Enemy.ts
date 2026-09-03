import { Entity } from '../engine/Entity';
import { parseColor } from '../engine/View';
import { resolveMovement } from './Movement';
import { Level } from './Level';
import { findPath, GridCoord, hasDirectLineOfSight } from './Pathfinding';
import enemiesPack from '../packs/Enemies.json';
import worldPack from '../packs/World.json';

export type EnemyType = keyof typeof enemiesPack.types;

export interface EnemyOptions {
  level?: Level;
  tileSize?: number;
}

/**
 * Enemy — standard dungeon crawler monster with aggro AI and corner-aware pathfinding.
 *
 * Tier 2. Reads definitions from Enemies.json pack in Tier 3. Holds no
 * rendering logic directly, delegating to Entity and View in Tier 1.
 */
export class Enemy extends Entity {
  public readonly enemyType: EnemyType;
  public readonly speed: number;
  public readonly damage: number;
  public readonly aggroRadius: number;
  public readonly maxStep: number;

  public state: 'IDLE' | 'AGGRO' = 'IDLE';

  private target?: Entity;
  private readonly level?: Level;
  private path: GridCoord[] = [];
  private repathTimer = 0;

  constructor(id: string, enemyType: EnemyType, x: number, y: number, options: EnemyOptions = {}) {
    const def = enemiesPack.types[enemyType];
    if (!def) {
      throw new Error(`Unknown enemy type: ${enemyType}`);
    }

    const tileSize = options.tileSize ?? options.level?.tileSize ?? worldPack.tileSize;
    const size = Math.round(tileSize * def.sizeRatio);

    super(id, x, y, {
      width: size,
      height: size,
      color: parseColor(def.color),
      sprite: def.sprite,
    });

    this.enemyType = enemyType;
    this.maxHealth = def.health;
    this.health = def.health;
    this.speed = def.speed;
    this.damage = def.damage;
    this.aggroRadius = def.aggroRadius;
    this.maxStep = tileSize / 2;
    this.level = options.level;
  }

  /** Assigns an entity target (e.g. the player) to track and engage. */
  public setTarget(target: Entity): void {
    this.target = target;
  }

  public override update(dt: number): void {
    if (this.target && this.target.isAlive) {
      const dx = this.target.x - this.x;
      const dy = this.target.y - this.y;
      const dist = Math.hypot(dx, dy);

      if (dist <= this.aggroRadius) {
        this.state = 'AGGRO';
      }

      if (this.state === 'AGGRO') {
        const stopDistance = Math.max(4, (this.width + this.target.width) / 4);
        if (dist > stopDistance) {
          let destX = this.target.x;
          let destY = this.target.y;

          if (this.level) {
            const canSeeDirectly = hasDirectLineOfSight(
              (x, y, w, h) => this.level!.isCollidingWithWall(x, y, w, h),
              { x: this.x, y: this.y },
              { x: this.target.x, y: this.target.y },
              this.width,
              this.height,
              this.level.tileSize / 2,
            );

            if (canSeeDirectly) {
              this.path = [];
              destX = this.target.x;
              destY = this.target.y;
            } else {
              const tileSize = this.level.tileSize;
              this.repathTimer -= dt;

              const enemyTile = {
                x: Math.floor(this.x / tileSize),
                y: Math.floor(this.y / tileSize),
              };
              const targetTile = {
                x: Math.floor(this.target.x / tileSize),
                y: Math.floor(this.target.y / tileSize),
              };

              // Recalculate path periodically or when needed
              if (
                this.repathTimer <= 0 ||
                (this.path.length === 0 &&
                  (enemyTile.x !== targetTile.x || enemyTile.y !== targetTile.y))
              ) {
                this.path = findPath(this.level.grid, enemyTile, targetTile);
                this.repathTimer = 0.25;
              }

              // Follow waypoints along open corridors/corners
              if (this.path.length > 0) {
                const nextTile = this.path[0];
                const nextCenter = this.level.tileCenter(nextTile.x, nextTile.y);
                const distToWaypoint = Math.hypot(nextCenter.x - this.x, nextCenter.y - this.y);

                if (distToWaypoint < Math.max(8, this.speed * dt * 1.5)) {
                  this.path.shift();
                  if (this.path.length > 0) {
                    const subsequent = this.level.tileCenter(this.path[0].x, this.path[0].y);
                    destX = subsequent.x;
                    destY = subsequent.y;
                  } else {
                    destX = this.target.x;
                    destY = this.target.y;
                  }
                } else {
                  destX = nextCenter.x;
                  destY = nextCenter.y;
                }
              }
            }
          }

          const toDestX = destX - this.x;
          const toDestY = destY - this.y;
          const destDist = Math.hypot(toDestX, toDestY);

          if (destDist > 0.001) {
            const dirX = toDestX / destDist;
            const dirY = toDestY / destDist;
            const moveX = dirX * this.speed * dt;
            const moveY = dirY * this.speed * dt;

            if (this.level) {
              const next = resolveMovement(
                (x, y, w, h) => this.level!.isCollidingWithWall(x, y, w, h),
                {
                  from: { x: this.x, y: this.y },
                  delta: { x: moveX, y: moveY },
                  width: this.width,
                  height: this.height,
                  maxStep: this.maxStep,
                },
              );
              this.x = next.x;
              this.y = next.y;
            } else {
              this.x += moveX;
              this.y += moveY;
            }
          }
        }
      }
    } else {
      this.state = 'IDLE';
    }

    this.syncView();
  }
}
