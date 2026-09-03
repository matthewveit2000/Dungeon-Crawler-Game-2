import { describe, it, expect } from 'vitest';
import { findPath, hasDirectLineOfSight } from './Pathfinding';
import { MapGrid } from './MapGrid';
import { TileType } from './MapGenerator';

describe('Pathfinding (BFS on MapGrid)', () => {
  it('returns empty array when start equals goal', () => {
    const grid = new MapGrid<TileType>(10, 10, TileType.FLOOR);
    const path = findPath(grid, { x: 2, y: 2 }, { x: 2, y: 2 });
    expect(path).toEqual([]);
  });

  it('finds a direct straight line path on open floor', () => {
    const grid = new MapGrid<TileType>(10, 10, TileType.FLOOR);
    const path = findPath(grid, { x: 1, y: 1 }, { x: 4, y: 1 });

    expect(path).toHaveLength(3);
    expect(path).toEqual([
      { x: 2, y: 1 },
      { x: 3, y: 1 },
      { x: 4, y: 1 },
    ]);
  });

  it('navigates around an L-shaped corner obstacle', () => {
    // 5x5 grid filled with walls
    const grid = new MapGrid<TileType>(6, 6, TileType.WALL);

    // Carve a path with a wall blocking direct line:
    // (1,1) -> (2,1) -> (2,2) -> (3,2) -> (4,2) -> (4,1)
    // with (3,1) being a WALL
    grid.set(1, 1, TileType.FLOOR);
    grid.set(2, 1, TileType.FLOOR);
    grid.set(2, 2, TileType.FLOOR);
    grid.set(3, 2, TileType.FLOOR);
    grid.set(4, 2, TileType.FLOOR);
    grid.set(4, 1, TileType.FLOOR);

    const path = findPath(grid, { x: 1, y: 1 }, { x: 4, y: 1 });

    expect(path).toEqual([
      { x: 2, y: 1 },
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 4, y: 2 },
      { x: 4, y: 1 },
    ]);
  });

  it('returns empty array if destination is completely unreachable', () => {
    const grid = new MapGrid<TileType>(5, 5, TileType.WALL);
    grid.set(1, 1, TileType.FLOOR);
    grid.set(3, 3, TileType.FLOOR);

    const path = findPath(grid, { x: 1, y: 1 }, { x: 3, y: 3 });
    expect(path).toEqual([]);
  });

  describe('hasDirectLineOfSight', () => {
    it('returns true when line between points does not intersect solid geometry', () => {
      const isSolid = () => false;
      expect(hasDirectLineOfSight(isSolid, { x: 0, y: 0 }, { x: 100, y: 100 }, 8, 8)).toBe(true);
    });

    it('returns false when a solid wall intersects the line between points', () => {
      const isSolid = (x: number) => x >= 40 && x <= 60;
      expect(hasDirectLineOfSight(isSolid, { x: 0, y: 0 }, { x: 100, y: 0 }, 8, 8)).toBe(false);
    });
  });
});
