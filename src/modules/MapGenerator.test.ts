import { describe, it, expect, beforeEach } from 'vitest';
import { MapGrid } from './MapGrid';
import { MapGenerator, TileType } from './MapGenerator';

describe('MapGenerator', () => {
  let grid: MapGrid<TileType>;
  const width = 20;
  const height = 20;

  beforeEach(() => {
    grid = new MapGrid<TileType>(width, height, TileType.WALL);
  });

  it('should carve floor tiles on the grid', () => {
    MapGenerator.generateRandomWalk(grid, 50);

    let floorCount = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (grid.get(x, y) === TileType.FLOOR) {
          floorCount++;
        }
      }
    }

    // Since we walked 50 steps, we should have carved some floor tiles (at least the starting tile).
    // Note: Due to random walk overlapping, the exact number varies, but it should be > 0.
    expect(floorCount).toBeGreaterThan(0);
  });

  it('should not produce any isolated or unreachable floor tiles', () => {
    // Generate a map
    MapGenerator.generateRandomWalk(grid, 200);

    let totalFloorCount = 0;
    let startX = -1;
    let startY = -1;

    // 1. Count total floor tiles and find the first one to start the flood fill
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (grid.get(x, y) === TileType.FLOOR) {
          totalFloorCount++;
          if (startX === -1 && startY === -1) {
            startX = x;
            startY = y;
          }
        }
      }
    }

    // If no floor tiles were generated, the test is trivially true, but let's assert we generated some
    expect(totalFloorCount).toBeGreaterThan(0);

    // 2. Perform Flood Fill to find reachable floor tiles
    let reachableFloorCount = 0;
    const visited = new Set<string>();
    const queue: {x: number, y: number}[] = [{x: startX, y: startY}];

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) continue;

      const key = `${current.x},${current.y}`;
      if (visited.has(key)) continue;

      visited.add(key);
      reachableFloorCount++;

      // Check adjacent cells
      const directions = [
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 }
      ];

      for (const dir of directions) {
        const nx = current.x + dir.dx;
        const ny = current.y + dir.dy;

        // check bounds and tile type
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          if (grid.get(nx, ny) === TileType.FLOOR && !visited.has(`${nx},${ny}`)) {
            queue.push({x: nx, y: ny});
          }
        }
      }
    }

    // 3. Assert that all floor tiles are reachable from the starting floor tile
    expect(reachableFloorCount).toBe(totalFloorCount);
  });
});
