import { describe, it, expect } from 'vitest';
import { Level } from './Level';
import { TileType } from './MapGenerator';

const snapshot = (level: Level): number[] => {
  const cells: number[] = [];
  for (let y = 0; y < level.grid.height; y++) {
    for (let x = 0; x < level.grid.width; x++) cells.push(level.grid.get(x, y));
  }
  return cells;
};

const countFloor = (level: Level) => snapshot(level).filter((t) => t === TileType.FLOOR).length;

describe('Level', () => {
  it('generates a floor on construction', () => {
    const level = new Level({ width: 40, height: 40, steps: 600, seed: 1 });
    expect(countFloor(level)).toBeGreaterThan(0);
  });

  it('always spawns the player on solid floor', () => {
    for (let seed = 0; seed < 20; seed++) {
      const level = new Level({ width: 40, height: 40, steps: 400, seed });
      const tile = level.spawnTile;
      expect(level.grid.get(tile.x, tile.y)).toBe(TileType.FLOOR);
    }
  });

  it('builds an identical floor from an identical seed', () => {
    const a = new Level({ width: 40, height: 40, steps: 600, seed: 4242 });
    const b = new Level({ width: 40, height: 40, steps: 600, seed: 4242 });
    expect(snapshot(a)).toEqual(snapshot(b));
  });

  it('builds a different floor from a different seed', () => {
    const a = new Level({ width: 40, height: 40, steps: 600, seed: 1 });
    const b = new Level({ width: 40, height: 40, steps: 600, seed: 2 });
    expect(snapshot(a)).not.toEqual(snapshot(b));
  });

  describe('regenerate', () => {
    it('replaces the grid with a genuinely different layout', () => {
      const level = new Level({ width: 40, height: 40, steps: 800, seed: 7 });
      const before = snapshot(level);
      const oldGrid = level.grid;

      level.regenerate();

      expect(level.grid).not.toBe(oldGrid);
      expect(level.grid.width).toBe(40);
      expect(level.grid.height).toBe(40);

      const after = snapshot(level);
      const changed = after.filter((tile, i) => tile !== before[i]).length;
      expect(changed).toBeGreaterThan(0);
    });

    it('keeps the new floor standable at the spawn point', () => {
      const level = new Level({ width: 40, height: 40, steps: 800, seed: 9 });
      for (let i = 0; i < 5; i++) {
        level.regenerate();
        const tile = level.spawnTile;
        expect(level.grid.get(tile.x, tile.y)).toBe(TileType.FLOOR);
      }
    });
  });

  describe('reseed', () => {
    it('reproduces a run exactly', () => {
      const level = new Level({ width: 40, height: 40, steps: 600, seed: 1 });
      level.reseed(555);
      const first = snapshot(level);

      level.reseed(555);
      expect(snapshot(level)).toEqual(first);
    });
  });

  describe('findFarthestFloor', () => {
    it('returns the most distant floor tile from a point', () => {
      const level = new Level({ width: 10, height: 10, steps: 0, seed: 1 });
      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) level.grid.set(x, y, TileType.WALL);
      }
      level.grid.set(1, 1, TileType.FLOOR);
      level.grid.set(8, 8, TileType.FLOOR);

      const found = level.findFarthestFloor(60, 60); // Centre of tile (1,1).
      expect(found).toEqual(level.tileCenter(8, 8));
    });
  });

  describe('isCollidingWithWall', () => {
    // Expressed in tiles rather than pixels, so a change of tile size cannot
    // silently invalidate what these assertions are checking.
    const walled = () => {
      const level = new Level({ width: 10, height: 10, steps: 0, seed: 1 });
      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) level.grid.set(x, y, TileType.WALL);
      }
      level.grid.set(1, 1, TileType.FLOOR);
      return level;
    };

    it('reports no collision inside a floor tile', () => {
      const level = walled();
      const size = level.tileSize / 4;
      const at = level.tileCenter(1, 1);
      expect(level.isCollidingWithWall(at.x, at.y, size, size)).toBe(false);
    });

    it('reports a collision when overlapping a wall tile', () => {
      const level = walled();
      const size = level.tileSize / 4;
      const at = level.tileCenter(1, 1);
      // Nudged far enough right that the box straddles into tile (2, 1).
      expect(level.isCollidingWithWall(at.x + level.tileSize / 2, at.y, size, size)).toBe(true);
    });

    it('treats out of bounds as solid', () => {
      const level = walled();
      const size = level.tileSize / 4;
      const at = level.tileCenter(1, 1);
      expect(level.isCollidingWithWall(-level.tileSize, at.y, size, size)).toBe(true);
      expect(level.isCollidingWithWall(at.x, level.tileSize * 100, size, size)).toBe(true);
    });

    it('does not falsely collide with the tile past an exact boundary', () => {
      // A box flush against the far edge of a tile occupies that tile only.
      const level = walled();
      const size = level.tileSize / 4;
      const flushX = 2 * level.tileSize - size / 2;
      const at = level.tileCenter(1, 1);
      expect(level.isCollidingWithWall(flushX, at.y, size, size)).toBe(false);
    });
  });
});
