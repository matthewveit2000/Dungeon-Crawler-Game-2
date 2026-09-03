import { describe, it, expect } from 'vitest';
import { Level } from './Level';
import { FloorManager } from './FloorManager';
import { EntityManager } from '../engine/EntityManager';
import { InputManager } from '../engine/InputManager';
import { TileType } from './MapGenerator';
import { Container } from 'pixi.js';

describe('Phase 33: Defeat Triggers & Treasure Rewards', () => {
  it('TDD Criteria: Boss HP hitting zero dispatches event to mutate treasure room door tiles to floor tiles', () => {
    const level = new Level({ seed: 42 });
    const stage = new Container();
    const entityManager = new EntityManager(stage);
    const inputManager = new InputManager();

    const floors = new FloorManager(level, entityManager, inputManager, () => {});
    floors.build();

    const boss = floors.getBoss()!;
    expect(boss).not.toBeNull();

    // Lock the arena as if encounter started
    level.lockBossArena();

    // Ensure treasure doors are initially wall or locked
    const treasureDoors = level.bossArenaBounds!.treasureDoors;
    for (const door of treasureDoors) {
      level.grid.set(door.x, door.y, TileType.WALL);
    }
    expect(level.isTreasureRoomUnlocked).toBe(false);

    // Defeat the boss
    boss.takeDamage(1000);
    expect(boss.isAlive).toBe(false);

    // Run FloorManager update to trigger defeat mechanics
    floors.update();

    // Verification of TDD Criteria:
    // 1. Treasure doors mutated to TileType.FLOOR
    for (const door of treasureDoors) {
      expect(level.grid.get(door.x, door.y)).toBe(TileType.FLOOR);
    }
    expect(level.isTreasureRoomUnlocked).toBe(true);

    // 2. High-tier loot cache spawned in treasure room
    const trCenter = level.bossArenaBounds!.treasureRoom.center;
    const trCenterWorld = level.tileCenter(trCenter.x, trCenter.y);
    const treasureDrops = floors
      .getLootDrops()
      .filter((drop) => Math.hypot(drop.x - trCenterWorld.x, drop.y - trCenterWorld.y) < 100);
    expect(treasureDrops.length).toBeGreaterThan(0);
  });
});
