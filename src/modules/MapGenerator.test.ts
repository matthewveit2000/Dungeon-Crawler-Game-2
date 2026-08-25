import { describe, it, expect, beforeEach } from 'vitest';
import { MapGrid } from './MapGrid';
import { MapGenerator, TileType } from './MapGenerator';
import { Rng } from '../engine/Rng';

const WIDTH = 30;
const HEIGHT = 30;

const countFloor = (grid: MapGrid<TileType>) => {
  let count = 0;
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      if (grid.get(x, y) === TileType.FLOOR) count++;
    }
  }
  return count;
};

/** Counts floor tiles reachable from the first floor tile found. */
const reachableFloor = (grid: MapGrid<TileType>) => {
  let start: [number, number] | null = null;
  for (let y = 0; y < grid.height && !start; y++) {
    for (let x = 0; x < grid.width && !start; x++) {
      if (grid.get(x, y) === TileType.FLOOR) start = [x, y];
    }
  }
  if (!start) return 0;

  const seen = new Set<string>([start.join(',')]);
  const queue: [number, number][] = [start];
  let count = 0;

  while (queue.length) {
    const [x, y] = queue.pop()!;
    count++;
    for (const [dx, dy] of [
      [0, -1],
      [0, 1],
      [-1, 0],
      [1, 0],
    ]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= grid.width || ny >= grid.height) continue;
      const key = `${nx},${ny}`;
      if (seen.has(key) || grid.get(nx, ny) !== TileType.FLOOR) continue;
      seen.add(key);
      queue.push([nx, ny]);
    }
  }
  return count;
};

const snapshot = (grid: MapGrid<TileType>) => {
  const cells: number[] = [];
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) cells.push(grid.get(x, y));
  }
  return cells;
};

describe('MapGenerator', () => {
  let grid: MapGrid<TileType>;

  beforeEach(() => {
    grid = new MapGrid<TileType>(WIDTH, HEIGHT, TileType.WALL);
  });

  it('carves floor tiles', () => {
    MapGenerator.generateRandomWalk(grid, { steps: 200, rng: new Rng(1) });
    expect(countFloor(grid)).toBeGreaterThan(0);
  });

  it('produces no isolated or unreachable floor tiles', () => {
    for (let seed = 0; seed < 15; seed++) {
      const g = new MapGrid<TileType>(WIDTH, HEIGHT, TileType.WALL);
      MapGenerator.generateRandomWalk(g, { steps: 400, brushRadius: 1, rng: new Rng(seed) });
      expect(reachableFloor(g)).toBe(countFloor(g));
    }
  });

  it('detects a disconnected map, so the connectivity check can actually fail', () => {
    // Guards the test above: prove the helper reports a real break in the map.
    MapGenerator.generateRandomWalk(grid, { steps: 200, rng: new Rng(3) });
    let carved = false;
    for (let y = 0; y < HEIGHT && !carved; y++) {
      for (let x = 0; x < WIDTH && !carved; x++) {
        if (grid.get(x, y) === TileType.WALL && x > 0 && y > 0) {
          grid.set(x, y, TileType.FLOOR); // A pocket with no neighbours carved.
          carved = true;
        }
      }
    }
    expect(reachableFloor(grid)).toBeLessThan(countFloor(grid));
  });

  it('leaves a solid perimeter so the player cannot leave the world', () => {
    MapGenerator.generateRandomWalk(grid, { steps: 5000, brushRadius: 1, rng: new Rng(11) });
    for (let x = 0; x < WIDTH; x++) {
      expect(grid.get(x, 0)).toBe(TileType.WALL);
      expect(grid.get(x, HEIGHT - 1)).toBe(TileType.WALL);
    }
    for (let y = 0; y < HEIGHT; y++) {
      expect(grid.get(0, y)).toBe(TileType.WALL);
      expect(grid.get(WIDTH - 1, y)).toBe(TileType.WALL);
    }
  });

  it('builds an identical map from an identical seed', () => {
    const a = new MapGrid<TileType>(WIDTH, HEIGHT, TileType.WALL);
    const b = new MapGrid<TileType>(WIDTH, HEIGHT, TileType.WALL);
    MapGenerator.generateRandomWalk(a, { steps: 400, brushRadius: 1, rng: new Rng(2024) });
    MapGenerator.generateRandomWalk(b, { steps: 400, brushRadius: 1, rng: new Rng(2024) });
    expect(snapshot(a)).toEqual(snapshot(b));
  });

  it('carves wider corridors as the brush radius grows', () => {
    const narrow = new MapGrid<TileType>(WIDTH, HEIGHT, TileType.WALL);
    const wide = new MapGrid<TileType>(WIDTH, HEIGHT, TileType.WALL);
    MapGenerator.generateRandomWalk(narrow, { steps: 300, brushRadius: 0, rng: new Rng(5) });
    MapGenerator.generateRandomWalk(wide, { steps: 300, brushRadius: 1, rng: new Rng(5) });
    expect(countFloor(wide)).toBeGreaterThan(countFloor(narrow));
  });

  it('leaves a grid too small for the brush untouched rather than throwing', () => {
    const tiny = new MapGrid<TileType>(3, 3, TileType.WALL);
    expect(() =>
      MapGenerator.generateRandomWalk(tiny, { steps: 50, brushRadius: 2, rng: new Rng(1) }),
    ).not.toThrow();
    expect(countFloor(tiny)).toBe(0);
  });

  it('still accepts a bare step count', () => {
    expect(() => MapGenerator.generateRandomWalk(grid, 100)).not.toThrow();
    expect(countFloor(grid)).toBeGreaterThan(0);
  });
});
