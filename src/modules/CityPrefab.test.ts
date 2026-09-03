import { describe, it, expect } from 'vitest';
import { MapGrid } from './MapGrid';
import { MapGenerator, TileType, IS_SAFE_ZONE } from './MapGenerator';
import { Level } from './Level';

describe('Phase 28: City Prefab Injection', () => {
  it('defines IS_SAFE_ZONE tile type flag', () => {
    expect(IS_SAFE_ZONE).toBe(TileType.SAFE_ZONE);
    expect(TileType.SAFE_ZONE).toBe(2);
  });

  it('TDD Criteria: City tiles are successfully flagged in the data grid as IS_SAFE_ZONE', () => {
    const grid = new MapGrid<TileType>(60, 60, TileType.WALL);
    const bounds = MapGenerator.injectCityPrefab(grid, { x: 20, y: 20, width: 10, height: 10 });

    expect(bounds.width).toBe(10);
    expect(bounds.height).toBe(10);

    // Interior floor tiles must be flagged IS_SAFE_ZONE
    let safeCount = 0;
    for (let y = bounds.y + 1; y < bounds.y + bounds.height - 1; y++) {
      for (let x = bounds.x + 1; x < bounds.x + bounds.width - 1; x++) {
        if (grid.get(x, y) === IS_SAFE_ZONE) {
          safeCount++;
        }
      }
    }
    expect(safeCount).toBeGreaterThan(0);
  });

  it('Level integrates City prefab and reports isSafeZone accurately', () => {
    const level = new Level({ seed: 42 });
    expect(level.cityBounds).toBeDefined();

    const cityCenter = level.cityBounds!.center;
    expect(level.isSafeZone(cityCenter.x, cityCenter.y)).toBe(true);

    // Out in distant cave, not safe zone
    expect(level.isSafeZone(0, 0)).toBe(false);

    // Safe zone tiles are walkable floor, not colliding walls
    expect(level.isCollidingWithWall(cityCenter.x, cityCenter.y, 8, 8)).toBe(false);
  });
});
