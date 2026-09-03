import { describe, it, expect } from 'vitest';
import { MapGrid } from './MapGrid';
import { MapGenerator, TileType } from './MapGenerator';
import { Level } from './Level';
import { Boss } from './Boss';

describe('Phase 31: Boss Arena Generation', () => {
  it('TDD Criteria: Room generates with a distinct entryway and attached treasure room boundaries', () => {
    const grid = new MapGrid<TileType>(80, 80, TileType.WALL);
    const bounds = MapGenerator.injectBossArena(grid, { x: 30, y: 30, width: 16, height: 16 });

    expect(bounds).toBeDefined();
    expect(bounds.arena.width).toBe(16);
    expect(bounds.arena.height).toBe(16);

    // Arena interior is walkable floor
    expect(grid.get(bounds.arena.center.x, bounds.arena.center.y)).toBe(TileType.FLOOR);

    // Distinct entryway exists connecting dungeon to arena
    expect(bounds.entranceDoors.length).toBeGreaterThan(0);
    for (const door of bounds.entranceDoors) {
      expect(grid.get(door.x, door.y)).toBe(TileType.FLOOR);
    }

    // Attached treasure room exists
    expect(bounds.treasureRoom.width).toBeGreaterThan(0);
    expect(bounds.treasureRoom.height).toBeGreaterThan(0);
    expect(grid.get(bounds.treasureRoom.center.x, bounds.treasureRoom.center.y)).toBe(
      TileType.FLOOR,
    );

    // Treasure door connecting arena and treasure room exists
    expect(bounds.treasureDoors.length).toBeGreaterThan(0);
  });

  it('instantiates Boss entity with high health and boss attributes', () => {
    const boss = new Boss('boss-1', 200, 200);
    expect(boss.maxHealth).toBeGreaterThanOrEqual(300);
    expect(boss.health).toBe(boss.maxHealth);
    expect(boss.damage).toBeGreaterThanOrEqual(20);
    expect(boss.state).toBe('NEUTRAL');
  });

  it('Level incorporates BossArena and exposes boundaries', () => {
    const level = new Level({ seed: 42 });
    expect(level.bossArenaBounds).toBeDefined();
    expect(level.bossArenaBounds!.arena.center).toBeDefined();
    expect(level.bossArenaBounds!.treasureRoom.center).toBeDefined();
  });
});
