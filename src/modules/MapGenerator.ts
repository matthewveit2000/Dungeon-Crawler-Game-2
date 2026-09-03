import { Rng } from '../engine/Rng';
import { MapGrid } from './MapGrid';

export enum TileType {
  WALL = 0,
  FLOOR = 1,
  SAFE_ZONE = 2,
}

export const IS_SAFE_ZONE = TileType.SAFE_ZONE;

export interface RandomWalkOptions {
  /** Number of steps the walker takes. */
  steps: number;
  /**
   * How far the carving brush reaches from the walker, in tiles. A radius of 0
   * carves single-tile corridors; 1 carves three-tile corridors. Corridors
   * narrower than a couple of tiles make navigation fiddly, because the player
   * has to be near-perfectly aligned to enter one.
   */
  brushRadius?: number;
  /** Seeded generator. Supplying one makes the map reproducible. */
  rng?: Rng;
}

export interface CityBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  center: { x: number; y: number };
}

export interface BossArenaBounds {
  arena: { x: number; y: number; width: number; height: number; center: { x: number; y: number } };
  entranceDoors: { x: number; y: number }[];
  treasureRoom: {
    x: number;
    y: number;
    width: number;
    height: number;
    center: { x: number; y: number };
  };
  treasureDoors: { x: number; y: number }[];
}

const DIRECTIONS = [
  { dx: 0, dy: -1 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
  { dx: 1, dy: 0 },
];

/**
 * MapGenerator — carves playable space out of a solid grid and stamps prefabs.
 *
 * Tier 2. Pure game rules: it reads its parameters from Tier 3 and mutates a
 * grid, with no knowledge of how any of it will be drawn.
 */
export class MapGenerator {
  /**
   * Carves contiguous floor space with a random walk.
   *
   * The walker starts at the centre and never leaves the interior, so the grid
   * keeps a solid perimeter and every carved tile is reachable from the start
   * by construction — there can be no isolated pockets.
   */
  public static generateRandomWalk(
    grid: MapGrid<TileType>,
    options: RandomWalkOptions | number,
  ): void {
    // A bare step count is still accepted so older call sites keep working.
    const opts: RandomWalkOptions = typeof options === 'number' ? { steps: options } : options;
    const brushRadius = opts.brushRadius ?? 0;
    const rng = opts.rng ?? Rng.random();

    // The brush must never reach the perimeter, or the map would leak open at
    // the edges and the player could walk out of the world.
    const margin = brushRadius + 1;
    if (grid.width <= margin * 2 || grid.height <= margin * 2) return;

    let currentX = Math.floor(grid.width / 2);
    let currentY = Math.floor(grid.height / 2);

    this.carve(grid, currentX, currentY, brushRadius);

    for (let i = 0; i < opts.steps; i++) {
      const dir = DIRECTIONS[rng.nextInt(DIRECTIONS.length)];
      const nextX = currentX + dir.dx;
      const nextY = currentY + dir.dy;

      if (
        nextX >= margin &&
        nextX < grid.width - margin &&
        nextY >= margin &&
        nextY < grid.height - margin
      ) {
        currentX = nextX;
        currentY = nextY;
        this.carve(grid, currentX, currentY, brushRadius);
      }
    }
  }

  /**
   * Stamps a predefined City safe zone room into the grid and flags interior tiles as IS_SAFE_ZONE.
   */
  public static injectCityPrefab(
    grid: MapGrid<TileType>,
    options: { x?: number; y?: number; width?: number; height?: number } = {},
  ): CityBounds {
    const width = options.width ?? 14;
    const height = options.height ?? 14;
    const startX = options.x ?? Math.floor((grid.width - width) / 2);
    const startY = options.y ?? Math.floor((grid.height - height) / 2);

    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        const gx = startX + dx;
        const gy = startY + dy;
        if (grid.inBounds(gx, gy)) {
          if (dx === 0 || dx === width - 1 || dy === 0 || dy === height - 1) {
            grid.set(gx, gy, TileType.WALL);
          } else {
            grid.set(gx, gy, TileType.SAFE_ZONE);
          }
        }
      }
    }

    // Door openings on top and bottom walls
    const midX = startX + Math.floor(width / 2);
    if (grid.inBounds(midX, startY)) grid.set(midX, startY, TileType.SAFE_ZONE);
    if (grid.inBounds(midX + 1, startY)) grid.set(midX + 1, startY, TileType.SAFE_ZONE);
    if (grid.inBounds(midX, startY + height - 1))
      grid.set(midX, startY + height - 1, TileType.SAFE_ZONE);
    if (grid.inBounds(midX + 1, startY + height - 1))
      grid.set(midX + 1, startY + height - 1, TileType.SAFE_ZONE);

    return {
      x: startX,
      y: startY,
      width,
      height,
      center: {
        x: startX + Math.floor(width / 2),
        y: startY + Math.floor(height / 2),
      },
    };
  }

  /**
   * Stamps a Boss Arena room with south entrance doors and an attached north treasure room.
   */
  public static injectBossArena(
    grid: MapGrid<TileType>,
    options: {
      x?: number;
      y?: number;
      width?: number;
      height?: number;
      treasureWidth?: number;
      treasureHeight?: number;
    } = {},
  ): BossArenaBounds {
    const width = options.width ?? 16;
    const height = options.height ?? 16;
    const treasureW = options.treasureWidth ?? 8;
    const treasureH = options.treasureHeight ?? 8;

    const startX = options.x ?? Math.floor((grid.width - width) / 2);
    const startY = options.y ?? Math.floor((grid.height - height) / 2);

    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        const gx = startX + dx;
        const gy = startY + dy;
        if (grid.inBounds(gx, gy)) {
          if (dx === 0 || dx === width - 1 || dy === 0 || dy === height - 1) {
            grid.set(gx, gy, TileType.WALL);
          } else {
            grid.set(gx, gy, TileType.FLOOR);
          }
        }
      }
    }

    // South entrance doors connecting dungeon to arena
    const midX = startX + Math.floor(width / 2);
    const entranceDoors: { x: number; y: number }[] = [];
    const doorY = startY + height - 1;
    if (grid.inBounds(midX, doorY)) {
      grid.set(midX, doorY, TileType.FLOOR);
      entranceDoors.push({ x: midX, y: doorY });
    }
    if (grid.inBounds(midX + 1, doorY)) {
      grid.set(midX + 1, doorY, TileType.FLOOR);
      entranceDoors.push({ x: midX + 1, y: doorY });
    }

    // Attached treasure room north of arena
    const trStartX = startX + Math.floor((width - treasureW) / 2);
    const trStartY = Math.max(0, startY - treasureH + 1);

    for (let dy = 0; dy < treasureH; dy++) {
      for (let dx = 0; dx < treasureW; dx++) {
        const gx = trStartX + dx;
        const gy = trStartY + dy;
        if (grid.inBounds(gx, gy)) {
          if (dx === 0 || dx === treasureW - 1 || dy === 0 || dy === treasureH - 1) {
            grid.set(gx, gy, TileType.WALL);
          } else {
            grid.set(gx, gy, TileType.FLOOR);
          }
        }
      }
    }

    // Treasure doors between arena north wall and treasure room
    const trMidX = trStartX + Math.floor(treasureW / 2);
    const treasureDoorY = startY;
    const treasureDoors: { x: number; y: number }[] = [];
    if (grid.inBounds(trMidX, treasureDoorY)) {
      grid.set(trMidX, treasureDoorY, TileType.FLOOR);
      treasureDoors.push({ x: trMidX, y: treasureDoorY });
    }
    if (grid.inBounds(trMidX + 1, treasureDoorY)) {
      grid.set(trMidX + 1, treasureDoorY, TileType.FLOOR);
      treasureDoors.push({ x: trMidX + 1, y: treasureDoorY });
    }

    return {
      arena: {
        x: startX,
        y: startY,
        width,
        height,
        center: {
          x: startX + Math.floor(width / 2),
          y: startY + Math.floor(height / 2),
        },
      },
      entranceDoors,
      treasureRoom: {
        x: trStartX,
        y: trStartY,
        width: treasureW,
        height: treasureH,
        center: {
          x: trStartX + Math.floor(treasureW / 2),
          y: trStartY + Math.floor(treasureH / 2),
        },
      },
      treasureDoors,
    };
  }

  /** Stamps a square of floor centred on (x, y). */
  private static carve(grid: MapGrid<TileType>, x: number, y: number, radius: number): void {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        grid.set(x + dx, y + dy, TileType.FLOOR);
      }
    }
  }
}
