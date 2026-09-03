import { Rng } from '../engine/Rng';
import { MapGrid } from './MapGrid';
import { MapGenerator, TileType, CityBounds, BossArenaBounds } from './MapGenerator';
import world from '../packs/World.json';
import prefabs from '../packs/Prefabs.json';

export interface LevelOptions {
  width?: number;
  height?: number;
  tileSize?: number;
  steps?: number;
  brushRadius?: number;
  /** Seed for the first floor. Supplying one makes the whole run reproducible. */
  seed?: number;
}

/**
 * Level — the dungeon floor as game state.
 *
 * Tier 2. Owns the grid, generates it, answers collision questions about it and
 * regenerates it on descent. It holds no PixiJS objects: how a floor is drawn
 * is Tier 1's concern, which keeps the game rules testable without a renderer.
 */
export class Level {
  public grid: MapGrid<TileType>;
  public readonly tileSize: number;
  public cityBounds?: CityBounds;
  public bossArenaBounds?: BossArenaBounds;
  public isBossArenaLocked = false;
  public isTreasureRoomUnlocked = false;

  private readonly steps: number;
  private readonly brushRadius: number;
  private rng: Rng;

  constructor(options: LevelOptions = {}) {
    const width = options.width ?? world.grid.width;
    const height = options.height ?? world.grid.height;

    this.tileSize = options.tileSize ?? world.tileSize;
    this.steps = options.steps ?? world.generation.walkSteps;
    this.brushRadius = options.brushRadius ?? world.generation.brushRadius;
    this.rng = options.seed === undefined ? Rng.random() : new Rng(options.seed);

    this.grid = new MapGrid<TileType>(width, height, TileType.WALL);
    this.generate();
  }

  /** The seed the current sequence of floors descends from. */
  public get seed(): number {
    return this.rng.seed;
  }

  /** Restarts generation from a known seed, so a run can be reproduced exactly. */
  public reseed(seed: number): void {
    this.rng = new Rng(seed);
    this.regenerate();
  }

  /** Discards the current floor and carves a fresh one of the same dimensions. */
  public regenerate(): void {
    this.grid = new MapGrid<TileType>(this.grid.width, this.grid.height, TileType.WALL);
    this.generate();
  }

  /** World-space centre of a tile. */
  public tileCenter(tileX: number, tileY: number): { x: number; y: number } {
    return {
      x: tileX * this.tileSize + this.tileSize / 2,
      y: tileY * this.tileSize + this.tileSize / 2,
    };
  }

  /** The tile the walker seeds from, and therefore always solid floor. */
  public get spawnTile(): { x: number; y: number } {
    return { x: Math.floor(this.grid.width / 2), y: Math.floor(this.grid.height / 2) };
  }

  /** World-space spawn point, guaranteed to be standable. */
  public get spawnPoint(): { x: number; y: number } {
    const tile = this.spawnTile;
    return this.tileCenter(tile.x, tile.y);
  }

  /**
   * Finds the floor tile furthest from a world position — where the staircase
   * belongs, so descending always demands a real journey.
   */
  public findFarthestFloor(fromX: number, fromY: number): { x: number; y: number } {
    let best = { x: fromX, y: fromY };
    let bestDistance = -1;

    for (let y = 0; y < this.grid.height; y++) {
      for (let x = 0; x < this.grid.width; x++) {
        if (this.grid.get(x, y) !== TileType.FLOOR) continue;

        const center = this.tileCenter(x, y);
        const dx = center.x - fromX;
        const dy = center.y - fromY;
        const distance = dx * dx + dy * dy; // Squared: ordering is all that matters.

        if (distance > bestDistance) {
          bestDistance = distance;
          best = center;
        }
      }
    }

    return best;
  }

  /**
   * Reports whether an axis-aligned box centred on (x, y) overlaps a wall.
   * Out-of-bounds counts as wall, so the world has hard edges.
   *
   * The epsilon on the far edges matters: a box whose right edge lands exactly
   * on a tile boundary occupies tiles up to but not including that one, and
   * without the subtraction `Math.floor` would report a false collision with
   * the tile beyond.
   */
  public isCollidingWithWall(x: number, y: number, width: number, height: number): boolean {
    const startGridX = Math.floor((x - width / 2) / this.tileSize);
    const endGridX = Math.floor((x + width / 2 - 0.001) / this.tileSize);
    const startGridY = Math.floor((y - height / 2) / this.tileSize);
    const endGridY = Math.floor((y + height / 2 - 0.001) / this.tileSize);

    for (let gy = startGridY; gy <= endGridY; gy++) {
      for (let gx = startGridX; gx <= endGridX; gx++) {
        if (gx < 0 || gx >= this.grid.width || gy < 0 || gy >= this.grid.height) return true;
        if (this.grid.get(gx, gy) === TileType.WALL) return true;
      }
    }

    return false;
  }

  public isSafeZone(worldX: number, worldY: number): boolean {
    const gx = Math.floor(worldX / this.tileSize);
    const gy = Math.floor(worldY / this.tileSize);
    if (gx < 0 || gx >= this.grid.width || gy < 0 || gy >= this.grid.height) return false;
    return this.grid.get(gx, gy) === TileType.SAFE_ZONE;
  }

  public isInsideBossArena(worldX: number, worldY: number): boolean {
    if (!this.bossArenaBounds) return false;
    const gx = Math.floor(worldX / this.tileSize);
    const gy = Math.floor(worldY / this.tileSize);
    const arena = this.bossArenaBounds.arena;
    return (
      gx > arena.x &&
      gx < arena.x + arena.width - 1 &&
      gy > arena.y &&
      gy < arena.y + arena.height - 1
    );
  }

  public lockBossArena(): void {
    this.isBossArenaLocked = true;
    if (this.bossArenaBounds) {
      for (const door of this.bossArenaBounds.entranceDoors) {
        this.grid.set(door.x, door.y, TileType.WALL);
      }
    }
  }

  public unlockTreasureRoom(): void {
    this.isTreasureRoomUnlocked = true;
    if (this.bossArenaBounds) {
      for (const door of this.bossArenaBounds.treasureDoors) {
        this.grid.set(door.x, door.y, TileType.FLOOR);
      }
      for (const door of this.bossArenaBounds.entranceDoors) {
        this.grid.set(door.x, door.y, TileType.FLOOR);
      }
    }
  }

  private generate(): void {
    MapGenerator.generateRandomWalk(this.grid, {
      steps: this.steps,
      brushRadius: this.brushRadius,
      rng: this.rng,
    });

    const cityW = prefabs.city.width;
    const cityH = prefabs.city.height;
    if (this.grid.width < cityW + 4 || this.grid.height < cityH + 4) return;

    const spawnT = this.spawnTile;
    const cityX = Math.max(
      2,
      Math.min(this.grid.width - cityW - 2, spawnT.x - Math.floor(cityW / 2)),
    );
    const cityY = Math.max(
      2,
      Math.min(this.grid.height - cityH - 2, spawnT.y - Math.floor(cityH / 2) - 8),
    );

    const bounds = MapGenerator.injectCityPrefab(this.grid, {
      x: cityX,
      y: cityY,
      width: cityW,
      height: cityH,
    });

    this.cityBounds = {
      ...bounds,
      center: this.tileCenter(bounds.center.x, bounds.center.y),
    };

    const arenaW = prefabs.bossArena?.width ?? 16;
    const arenaH = prefabs.bossArena?.height ?? 16;
    if (this.grid.width >= arenaW + 16 && this.grid.height >= arenaH + 16) {
      const arenaX = Math.max(2, Math.min(this.grid.width - arenaW - 2, spawnT.x + 10));
      const arenaY = Math.max(10, Math.min(this.grid.height - arenaH - 2, spawnT.y + 10));
      this.bossArenaBounds = MapGenerator.injectBossArena(this.grid, {
        x: arenaX,
        y: arenaY,
        width: arenaW,
        height: arenaH,
      });
    }
  }
}
