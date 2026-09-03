import { EntityManager } from '../engine/EntityManager';
import { InputManager } from '../engine/InputManager';
import { Rng } from '../engine/Rng';
import { Level } from './Level';
import { TileType } from './MapGenerator';
import { Player } from './Player';
import { Staircase } from './Staircase';
import { Enemy } from './Enemy';
import { EnemySpawner } from './EnemySpawner';
import { Projectile } from './Projectile';
import { LootDrop } from './LootDrop';
import { Item } from './Item';
import { ItemGenerator } from './ItemGenerator';
import { Vendor } from './Vendor';
import { Boss } from './Boss';
import progressionPack from '../packs/Progression.json';

const PLAYER_ID = 'player-1';
const STAIRCASE_ID = 'staircase-1';

/**
 * FloorManager — owns the lifecycle of a dungeon floor.
 *
 * Tier 2. Building a floor, placing the player and staircase, and wiping
 * everything on descent are game rules, so they live here rather than in the
 * application bootstrap. Descending clears the entire entity set, which is what
 * "wipe the current floor" has to mean if memory is to be released.
 */
export class FloorManager {
  public readonly level: Level;

  private readonly entityManager: EntityManager;
  private readonly inputManager: InputManager;
  private readonly onFloorBuilt: (level: Level) => void;
  private readonly enemySpawner: EnemySpawner;

  private player: Player | null = null;
  private staircase: Staircase | null = null;
  private enemies: Enemy[] = [];
  private lootDrops: LootDrop[] = [];
  private vendor: Vendor | null = null;
  private boss: Boss | null = null;
  private depth = 1;
  private descendRequested = false;
  private readonly itemGen: ItemGenerator;

  constructor(
    level: Level,
    entityManager: EntityManager,
    inputManager: InputManager,
    onFloorBuilt: (level: Level) => void,
    enemySpawner?: EnemySpawner,
    itemGen?: ItemGenerator,
  ) {
    this.level = level;
    this.entityManager = entityManager;
    this.inputManager = inputManager;
    this.onFloorBuilt = onFloorBuilt;
    this.enemySpawner = enemySpawner ?? new EnemySpawner(new Rng(level.seed));
    this.itemGen = itemGen ?? new ItemGenerator(new Rng(level.seed));
  }

  /** How many floors deep the run currently is, counting from one. */
  public get currentDepth(): number {
    return this.depth;
  }

  public getPlayer(): Player | null {
    return this.player;
  }

  public getStaircase(): Staircase | null {
    return this.staircase;
  }

  /** Populates the current floor with a player and a staircase. */
  public build(): Player {
    this.entityManager.clear();
    this.lootDrops = [];

    const spawn = this.level.spawnPoint;
    const player = new Player(PLAYER_ID, spawn.x, spawn.y, this.inputManager, {
      level: this.level,
    });

    const exit = this.level.findFarthestFloor(spawn.x, spawn.y);
    const staircase = new Staircase(STAIRCASE_ID, exit.x, exit.y);

    // The staircase is added first so the player renders above it.
    this.entityManager.addEntity(staircase);
    this.entityManager.addEntity(player);

    this.enemies = this.enemySpawner.spawn(this.level, spawn);
    for (const enemy of this.enemies) {
      enemy.setTarget(player);
      this.entityManager.addEntity(enemy);
    }

    player.setEnemyTargets(this.enemies);
    player.setSpawnProjectileCallback((proj) => {
      this.entityManager.addEntity(proj);
    });

    player.setStaircase(staircase);
    player.setInteractionCallback(() => this.descend());
    this.descendRequested = false;

    this.player = player;
    this.staircase = staircase;

    if (this.level.cityBounds) {
      this.vendor = new Vendor(
        'vendor-haven',
        this.level.cityBounds.center.x,
        this.level.cityBounds.center.y,
        this.level.tileSize,
      );
      this.entityManager.addEntity(this.vendor);
    }

    if (this.level.bossArenaBounds) {
      const arenaCenter = this.level.bossArenaBounds.arena.center;
      const centerWorld = this.level.tileCenter(arenaCenter.x, arenaCenter.y);
      this.boss = new Boss('boss-guardian', centerWorld.x, centerWorld.y, { level: this.level });
      this.boss.setTarget(player);
      this.entityManager.addEntity(this.boss);
      this.enemies.push(this.boss);
    }

    this.onFloorBuilt(this.level);
    return player;
  }

  public getVendor(): Vendor | null {
    return this.vendor;
  }

  public getBoss(): Boss | null {
    return this.boss;
  }

  public getEnemies(): Enemy[] {
    return this.enemies;
  }

  /**
   * Requests the next floor. The rebuild is deferred to `update()` because the
   * request arrives from inside the player's own update, and destroying an
   * entity partway through its update leaves the loop working on a torn-down
   * object.
   */
  public descend(): void {
    this.descendRequested = true;
  }

  /** True while a descent is waiting to be applied. */
  public get isDescendPending(): boolean {
    return this.descendRequested;
  }

  /**
   * Applies a pending descent and manages projectile hits and defeated enemy cleanup.
   */
  public update(): void {
    if (
      this.boss &&
      this.boss.isAlive &&
      !this.level.isBossArenaLocked &&
      this.player &&
      this.level.isInsideBossArena(this.player.x, this.player.y)
    ) {
      this.level.lockBossArena();
      this.boss.activateAggro();
      this.onFloorBuilt(this.level);
    }

    if (this.boss && !this.boss.isAlive && !this.level.isTreasureRoomUnlocked) {
      this.level.unlockTreasureRoom();
      this.onFloorBuilt(this.level);
      if (this.level.bossArenaBounds) {
        const tr = this.level.bossArenaBounds.treasureRoom;
        const trWorld = this.level.tileCenter(tr.center.x, tr.center.y);
        const rareLoot = this.itemGen.generateItem({
          rarity: 'rare',
          level: this.currentDepth + 2,
        });
        const legLoot = this.itemGen.generateItem({
          rarity: 'legendary',
          level: this.currentDepth + 2,
        });
        this.spawnLootDrop(trWorld.x, trWorld.y, rareLoot);
        this.spawnLootDrop(trWorld.x + 20, trWorld.y, legLoot);
      }
    }

    const entities = this.entityManager.getEntities();
    for (const entity of entities) {
      if (entity instanceof Projectile) {
        for (const enemy of this.enemies) {
          if (entity.checkCollisionWith(enemy)) {
            break;
          }
        }
      }
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (!enemy.isAlive) {
        this.enemies.splice(i, 1);
        this.entityManager.removeEntity(enemy.id);
        this.spawnLootDrop(enemy.x, enemy.y);
        if (this.player) {
          this.player.gold += 10;
          const xpMap = progressionPack.enemyXP as Record<string, number>;
          const xpAmount =
            enemy instanceof Boss ? (xpMap.boss ?? 250) : (xpMap[enemy.enemyType] ?? 25);
          this.player.addXP(xpAmount);
        }
        enemy.destroy();
      }
    }

    if (this.player) {
      const pickupRadius = this.level.tileSize * 0.75;
      for (let i = this.lootDrops.length - 1; i >= 0; i--) {
        const drop = this.lootDrops[i];
        const dist = Math.hypot(this.player.x - drop.x, this.player.y - drop.y);
        if (dist <= pickupRadius) {
          drop.collect();
          this.player.addToInventory(drop.item);
          this.lootDrops.splice(i, 1);
          this.entityManager.removeEntity(drop.id);
          drop.destroy();
        }
      }
    }

    for (const entity of this.entityManager.getEntities()) {
      if (entity.isDestroyed) {
        this.entityManager.removeEntity(entity.id);
      }
    }

    if (!this.descendRequested) return;

    this.descendRequested = false;
    this.depth++;
    this.level.regenerate();
    this.build();
  }

  public getLootDrops(): LootDrop[] {
    return this.lootDrops;
  }

  public spawnLootDrop(x: number, y: number, item?: Item): LootDrop {
    const droppedItem = item ?? this.itemGen.generateItem({ level: this.currentDepth });
    const drop = new LootDrop(
      `loot-drop-${Date.now()}-${this.lootDrops.length}`,
      x,
      y,
      droppedItem,
      { tileSize: this.level.tileSize },
    );
    this.lootDrops.push(drop);
    this.entityManager.addEntity(drop);
    return drop;
  }

  /** Restarts the run from a known seed. Used by the audit toolkit. */
  public restartFromSeed(seed: number): void {
    this.depth = 1;
    this.level.reseed(seed);
    this.build();
  }

  /** Moves the player onto the staircase, for hands-on verification. */
  public teleportToStaircase(): boolean {
    if (!this.player || !this.staircase) return false;

    this.player.x = this.staircase.x;
    this.player.y = this.staircase.y;
    this.player.syncView();
    return true;
  }

  /** Aggregates statistical metrics for the active dungeon floor. */
  public getFloorStats(): Record<string, number> {
    let floorTiles = 0;
    for (let y = 0; y < this.level.grid.height; y++) {
      for (let x = 0; x < this.level.grid.width; x++) {
        if (this.level.grid.get(x, y) === TileType.FLOOR) floorTiles++;
      }
    }
    const spawn = this.level.spawnPoint;
    const exit = this.level.findFarthestFloor(spawn.x, spawn.y);
    const distance = Math.hypot(exit.x - spawn.x, exit.y - spawn.y);
    return {
      depth: this.currentDepth,
      seed: this.level.seed,
      enemies: this.enemies.length,
      floorTiles,
      gridTiles: this.level.grid.width * this.level.grid.height,
      worldWidthPx: this.level.grid.width * this.level.tileSize,
      worldHeightPx: this.level.grid.height * this.level.tileSize,
      stairsDistancePx: Math.round(distance),
      stairsSecondsAway: Math.round(distance / (this.player?.speed ?? 1)),
    };
  }
}
