import { Entity } from '../engine/Entity';
import { InputManager, InputState } from '../engine/InputManager';
import { parseColor } from '../engine/View';
import { Level } from './Level';
import { resolveMovement } from './Movement';
import { Weapon, WeaponId, AttackResult } from './Weapon';
import { Projectile } from './Projectile';
import { Item } from './Item';
import { Inventory } from './Inventory';
import { ProgressionManager, LevelUpResult } from './Progression';
import playerPack from '../packs/Player.json';
import controls from '../packs/Controls.json';
import world from '../packs/World.json';

export interface PlayerOptions {
  level?: Level;
  /** Overrides the size derived from the level's tile size. */
  size?: number;
  speed?: number;
  health?: number;
  maxHealth?: number;
  weaponId?: WeaponId;
}

/** Tile size used when a player is created without a level to scale against. */
const FALLBACK_TILE_SIZE = world.tileSize;

/**
 * Player — the character the player drives.
 *
 * Tier 2. Reads its stats from the Tier 3 player pack and its keys from the
 * controls pack, then asks the shared movement resolver to carry it through the
 * level. It holds no rendering code of its own.
 */
export class Player extends Entity {
  public readonly speed: number;
  public weapon: Weapon;
  public gold = 0;
  public readonly inventoryManager = new Inventory();
  public readonly progression = new ProgressionManager();

  public get inventory(): Item[] {
    return this.inventoryManager.items;
  }

  public get level(): number {
    return this.progression.level;
  }

  public get xp(): number {
    return this.progression.currentXP;
  }

  public get xpToNextLevel(): number {
    return this.progression.xpToNextLevel;
  }

  public get attributePoints(): number {
    return this.progression.attributePoints;
  }

  public get skillPoints(): number {
    return this.progression.skillPoints;
  }

  private readonly baseMaxHealth: number;
  private readonly inputManager: InputManager;
  private readonly levelModule?: Level;
  private readonly interactRadius: number;
  private readonly maxStep: number;

  private staircase?: Entity;
  private onInteract?: () => void;
  private onSpawnProjectile?: (proj: Projectile) => void;
  private enemyTargets: Entity[] = [];
  private screenToWorldFn?: (x: number, y: number) => { x: number; y: number };

  constructor(
    id: string,
    x: number,
    y: number,
    inputManager: InputManager,
    options: PlayerOptions = {},
  ) {
    const tileSize = options.level?.tileSize ?? FALLBACK_TILE_SIZE;

    // The collision box is deliberately a fraction of the sprite. A 64x64
    // character sprite that collided across its full width could not fit
    // anywhere its art suggests it should; the box represents the feet.
    const size = options.size ?? Math.round(tileSize * playerPack.sizeRatio);

    super(id, x, y, {
      width: size,
      height: size,
      color: parseColor(playerPack.color),
      sprite: playerPack.sprite,
      animations: playerPack.animations,
      defaultAnimation: 'idle',
    });

    this.baseMaxHealth = options.maxHealth ?? playerPack.maxHealth ?? 100;
    this.maxHealth = this.baseMaxHealth;
    this.health = options.health ?? this.maxHealth;

    this.inputManager = inputManager;
    this.levelModule = options.level;
    this.speed = options.speed ?? playerPack.speed;
    this.interactRadius = playerPack.interactRadius;
    this.weapon = new Weapon(options.weaponId ?? 'sword');

    // Never advance more than half a tile between collision tests, so no amount
    // of movement in one step can skip over a wall.
    this.maxStep = tileSize / 2;
  }

  public equipWeapon(id: WeaponId): void {
    this.weapon = new Weapon(id);
  }

  public addToInventory(item: Item): void {
    this.inventoryManager.addItem(item);
  }

  public refreshEquippedStats(): void {
    const bonus = this.inventoryManager.getEffectiveBonusStats();
    const progBonus = this.progression.getBonusStats();
    this.maxHealth = this.baseMaxHealth + bonus.bonusHealth + progBonus.bonusHealth;
    this.health = Math.min(this.health, this.maxHealth);
  }

  public heal(amount: number): number {
    const healed = Math.min(amount, this.maxHealth - this.health);
    this.health += healed;
    return healed;
  }

  public addXP(amount: number): LevelUpResult {
    const result = this.progression.addXP(amount);
    if (result.leveledUp) {
      this.refreshEquippedStats();
    }
    return result;
  }

  public override takeDamage(amount: number): number {
    const defense =
      this.inventoryManager.getEffectiveBonusStats().bonusDefense +
      this.progression.getBonusStats().bonusDefense;
    const effective = Math.max(1, amount - defense);
    return super.takeDamage(effective);
  }

  public setEnemyTargets(targets: Entity[]): void {
    this.enemyTargets = targets;
  }

  public setSpawnProjectileCallback(callback: (proj: Projectile) => void): void {
    this.onSpawnProjectile = callback;
  }

  public setScreenToWorld(fn: (x: number, y: number) => { x: number; y: number }): void {
    this.screenToWorldFn = fn;
  }

  public setStaircase(staircase: Entity): void {
    this.staircase = staircase;
  }

  public setInteractionCallback(callback: () => void): void {
    this.onInteract = callback;
  }

  public attackAt(targetX: number, targetY: number): AttackResult {
    const bonusDamage =
      this.inventoryManager.getEffectiveBonusStats().bonusDamage +
      this.progression.getBonusStats().bonusDamage;
    return this.weapon.attack(this.x, this.y, targetX, targetY, {
      targets: this.enemyTargets,
      level: this.levelModule,
      ownerId: this.id,
      bonusDamage,
      onSpawnProjectile: this.onSpawnProjectile,
    });
  }

  public update(dt: number): void {
    const state = this.inputManager.getState();

    this.weapon.update(dt);
    this.handleInteraction(state.justPressed);
    this.handleCombat(state);
    this.handleMovement(state.keys, dt);
    this.updateAnimation(dt);

    // Unconditional, so external repositioning (descending, teleports) is
    // reflected without every caller having to move the sprite by hand.
    this.syncView();
  }

  /** Handles attacking and weapon swapping. */
  private handleCombat(state: InputState): void {
    if (isActionPressed(state.justPressed, controls.switchWeapon)) {
      this.equipWeapon(this.weapon.id === 'sword' ? 'bow' : 'sword');
    }

    if (isActionPressed(state.justPressed, controls.attack)) {
      let targetX = this.x + 10;
      let targetY = this.y;

      if (this.screenToWorldFn) {
        const aim = this.screenToWorldFn(state.mouse.x, state.mouse.y);
        targetX = aim.x;
        targetY = aim.y;
      }

      this.attackAt(targetX, targetY);
    }
  }

  /**
   * Reads the edge state rather than the held state, so holding the key cannot
   * fire repeatedly and a tap shorter than one frame is not lost.
   */
  private handleInteraction(justPressed: Record<string, boolean>): void {
    if (!isActionPressed(justPressed, controls.interact)) return;
    if (!this.staircase || !this.onInteract) return;

    const dx = this.x - this.staircase.x;
    const dy = this.y - this.staircase.y;

    if (Math.hypot(dx, dy) < this.interactRadius) {
      this.onInteract();
    }
  }

  private handleMovement(keys: Record<string, boolean>, dt: number): void {
    let dx = 0;
    let dy = 0;

    if (isActionPressed(keys, controls.moveUp)) dy -= 1;
    if (isActionPressed(keys, controls.moveDown)) dy += 1;
    if (isActionPressed(keys, controls.moveLeft)) dx -= 1;
    if (isActionPressed(keys, controls.moveRight)) dx += 1;

    if (dx === 0 && dy === 0) {
      this.playAnimation('idle');
      return;
    }

    this.playAnimation('walk');

    // Normalised, so travelling diagonally is no faster than travelling straight.
    const length = Math.hypot(dx, dy);
    const delta = {
      x: (dx / length) * this.speed * dt,
      y: (dy / length) * this.speed * dt,
    };

    if (!this.levelModule) {
      this.x += delta.x;
      this.y += delta.y;
      return;
    }

    const level = this.levelModule;
    const next = resolveMovement(
      (x, y, width, height) => level.isCollidingWithWall(x, y, width, height),
      {
        from: { x: this.x, y: this.y },
        delta,
        width: this.width,
        height: this.height,
        maxStep: this.maxStep,
      },
    );

    this.x = next.x;
    this.y = next.y;
  }
}

/** True when any key bound to an action is currently held. */
function isActionPressed(keys: Record<string, boolean>, bindings: string[]): boolean {
  return bindings.some((key) => keys[key] === true);
}
