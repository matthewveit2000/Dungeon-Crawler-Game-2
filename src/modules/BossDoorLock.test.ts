import { describe, it, expect } from 'vitest';
import { Level } from './Level';
import { FloorManager } from './FloorManager';
import { EntityManager } from '../engine/EntityManager';
import { InputManager } from '../engine/InputManager';
import { TileType } from './MapGenerator';
import { Container } from 'pixi.js';

describe('Phase 32: Spatial Door Locking & Neutral State', () => {
  it('TDD Criteria: Player intersecting the threshold triggers tile mutation and shifts Boss to AGGRO', () => {
    const level = new Level({ seed: 42 });
    const stage = new Container();
    const entityManager = new EntityManager(stage);
    const inputManager = new InputManager();

    let gridRedrawn = false;
    const floors = new FloorManager(level, entityManager, inputManager, () => {
      gridRedrawn = true;
    });

    const player = floors.build();
    const boss = floors.getBoss()!;
    expect(boss).not.toBeNull();
    expect(boss.state).toBe('NEUTRAL');

    const arena = level.bossArenaBounds!.arena;
    const doors = level.bossArenaBounds!.entranceDoors;

    // Doors must initially be open floors
    for (const door of doors) {
      expect(level.grid.get(door.x, door.y)).toBe(TileType.FLOOR);
    }
    expect(level.isBossArenaLocked).toBe(false);

    // Place player right at the entrance doors (outside)
    const doorWorld = level.tileCenter(doors[0].x, doors[0].y);
    player.x = doorWorld.x;
    player.y = doorWorld.y;
    player.syncView();

    floors.update();
    expect(boss.state).toBe('NEUTRAL');
    expect(level.isBossArenaLocked).toBe(false);

    // Move player inside the arena past the threshold
    const insideWorld = level.tileCenter(arena.center.x, arena.center.y);
    player.x = insideWorld.x;
    player.y = insideWorld.y;
    player.syncView();

    // Trigger update
    floors.update();

    // Verification of TDD Criteria:
    // 1. Door tiles mutate to WALL
    for (const door of doors) {
      expect(level.grid.get(door.x, door.y)).toBe(TileType.WALL);
    }
    // 2. Boss shifts to AGGRO
    expect(boss.state).toBe('AGGRO');
    expect(level.isBossArenaLocked).toBe(true);

    // 3. Doors now block movement as solid walls
    expect(level.isCollidingWithWall(doorWorld.x, doorWorld.y, player.width, player.height)).toBe(
      true,
    );
    expect(gridRedrawn).toBe(true);
  });
});
