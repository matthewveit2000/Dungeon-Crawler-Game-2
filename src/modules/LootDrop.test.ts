import { describe, it, expect } from 'vitest';
import { LootDrop } from './LootDrop';
import { Item } from './Item';
import { InputManager } from '../engine/InputManager';
import { EntityManager } from '../engine/EntityManager';
import { Level } from './Level';
import { FloorManager } from './FloorManager';
import { Container } from 'pixi.js';

describe('Phase 26: Dropping & Looting Logic', () => {
  it('creates a LootDrop entity wrapping an item with rarity color', () => {
    const item = new Item({
      id: 'test-item-1',
      name: 'Common Dagger',
      baseId: 'dagger',
      slot: 'weapon',
      rarity: 'common',
      level: 1,
      stats: { damage: 10 },
      color: '0xffffff',
    });

    const drop = new LootDrop('drop-1', 100, 100, item, { tileSize: 32 });
    expect(drop.item).toBe(item);
    expect(drop.x).toBe(100);
    expect(drop.y).toBe(100);
    expect(drop.isCollected).toBe(false);
  });

  it('TDD Criteria: Collision with a loot entity removes it from world array and pushes it to player inventory array', () => {
    const level = new Level({ seed: 1234 });
    const stage = new Container();
    const entityManager = new EntityManager(stage);
    const inputManager = new InputManager();
    const floors = new FloorManager(level, entityManager, inputManager, () => {});
    const player = floors.build();

    const item = new Item({
      id: 'loot-sword',
      name: 'Rare Sword',
      baseId: 'sword',
      slot: 'weapon',
      rarity: 'rare',
      level: 2,
      stats: { damage: 25 },
      color: '0x0070dd',
    });

    // Spawn loot drop right at player coordinates
    const drop = floors.spawnLootDrop(player.x, player.y, item);
    expect(floors.getLootDrops()).toContain(drop);
    expect(player.inventory).toHaveLength(0);

    // Run floor update to resolve proximity collection
    floors.update();

    expect(player.inventory).toContain(item);
    expect(drop.isCollected).toBe(true);
    expect(floors.getLootDrops()).not.toContain(drop);
  });
});
