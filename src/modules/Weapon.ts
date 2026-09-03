import { Entity } from '../engine/Entity';
import { Level } from './Level';
import { Projectile } from './Projectile';
import weaponsPack from '../packs/Weapons.json';

export type WeaponId = keyof typeof weaponsPack.weapons;

export interface AttackOptions {
  targets?: Entity[];
  level?: Level;
  ownerId?: string;
  onSpawnProjectile?: (projectile: Projectile) => void;
}

export interface AttackResult {
  type: 'melee' | 'ranged';
  damage: number;
  hits?: number;
  projectile?: Projectile;
}

/**
 * Weapon — combat archetype managing attack cooldowns, hitboxes, and projectile generation.
 *
 * Tier 2. Reads definitions from Weapons.json in Tier 3. Holds no rendering references directly.
 */
export class Weapon {
  public readonly id: WeaponId;
  public readonly name: string;
  public readonly type: 'melee' | 'ranged';
  public readonly damage: number;
  public readonly cooldown: number;

  // Melee-specific
  public readonly range: number;
  public readonly hitboxWidth: number;
  public readonly hitboxHeight: number;

  // Ranged-specific
  public readonly projectileSpeed: number;
  public readonly projectileSize: number;
  public readonly maxRange: number;

  private cooldownTimer = 0;

  constructor(id: WeaponId) {
    const def = weaponsPack.weapons[id] as any;
    if (!def) {
      throw new Error(`Unknown weapon id: ${id}`);
    }

    this.id = id;
    this.name = def.name;
    this.type = def.type;
    this.damage = def.damage;
    this.cooldown = def.cooldown;

    this.range = def.range ?? 36;
    this.hitboxWidth = def.hitboxWidth ?? 32;
    this.hitboxHeight = def.hitboxHeight ?? 32;

    this.projectileSpeed = def.projectileSpeed ?? 300;
    this.projectileSize = def.projectileSize ?? 8;
    this.maxRange = def.maxRange ?? 250;
  }

  public canAttack(): boolean {
    return this.cooldownTimer <= 0;
  }

  public update(dt: number): void {
    if (this.cooldownTimer > 0) {
      this.cooldownTimer = Math.max(0, this.cooldownTimer - dt);
    }
  }

  public attack(
    originX: number,
    originY: number,
    targetX: number,
    targetY: number,
    options: AttackOptions = {},
  ): AttackResult {
    if (!this.canAttack()) {
      return { type: this.type, damage: 0, hits: 0 };
    }

    this.cooldownTimer = this.cooldown;

    const dx = targetX - originX;
    const dy = targetY - originY;
    const len = Math.hypot(dx, dy);
    const dirX = len > 0 ? dx / len : 1;
    const dirY = len > 0 ? dy / len : 0;

    if (this.type === 'melee') {
      const hx = originX + dirX * (this.range / 2);
      const hy = originY + dirY * (this.range / 2);
      let hits = 0;

      if (options.targets) {
        for (const target of options.targets) {
          if (!target.isAlive) continue;
          if (options.ownerId && target.id === options.ownerId) continue;

          const halfW = (this.hitboxWidth + target.width) / 2;
          const halfH = (this.hitboxHeight + target.height) / 2;

          const overlaps = Math.abs(hx - target.x) <= halfW && Math.abs(hy - target.y) <= halfH;

          if (overlaps) {
            target.takeDamage(this.damage);
            hits++;
          }
        }
      }

      return { type: 'melee', damage: this.damage, hits };
    } else {
      const proj = new Projectile(`proj-${Date.now()}-${Math.floor(originX)}`, originX, originY, {
        dirX,
        dirY,
        speed: this.projectileSpeed,
        damage: this.damage,
        maxRange: this.maxRange,
        size: this.projectileSize,
        level: options.level,
        ownerId: options.ownerId,
      });

      options.onSpawnProjectile?.(proj);
      return { type: 'ranged', damage: this.damage, projectile: proj };
    }
  }
}
