import { Rng } from '../engine/Rng';
import { MapGrid } from './MapGrid';

export enum TileType {
  WALL = 0,
  FLOOR = 1,
}

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

const DIRECTIONS = [
  { dx: 0, dy: -1 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
  { dx: 1, dy: 0 },
];

/**
 * MapGenerator — carves playable space out of a solid grid.
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

  /** Stamps a square of floor centred on (x, y). */
  private static carve(grid: MapGrid<TileType>, x: number, y: number, radius: number): void {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        grid.set(x + dx, y + dy, TileType.FLOOR);
      }
    }
  }
}
