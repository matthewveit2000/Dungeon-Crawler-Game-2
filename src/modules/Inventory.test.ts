import { describe, it, expect } from 'vitest';
import { Inventory } from './Inventory';
import { Item } from './Item';
import { Player } from './Player';
import { InputManager } from '../engine/InputManager';
import { Level } from './Level';

describe('Phase 27: Inventory Menu & Equipping', () => {
  it('equips weapon and armor into dedicated equipment slots', () => {
    const inv = new Inventory();
    const sword = new Item({
      id: 'sword-1',
      name: 'Steel Sword',
      baseId: 'sword',
      slot: 'weapon',
      rarity: 'common',
      level: 1,
      stats: { damage: 20 },
      color: '0xffffff',
    });
    const tunic = new Item({
      id: 'tunic-1',
      name: 'Leather Tunic',
      baseId: 'armor_leather',
      slot: 'armor',
      rarity: 'common',
      level: 1,
      stats: { defense: 8, healthBonus: 25 },
      color: '0xffffff',
    });

    inv.addItem(sword);
    inv.addItem(tunic);

    expect(inv.equippedWeapon).toBeNull();
    expect(inv.equippedArmor).toBeNull();

    inv.equip(sword);
    expect(inv.equippedWeapon).toBe(sword);
    expect(inv.items).not.toContain(sword);

    inv.equip(tunic);
    expect(inv.equippedArmor).toBe(tunic);
    expect(inv.items).not.toContain(tunic);

    const stats = inv.getEffectiveBonusStats();
    expect(stats.bonusDamage).toBe(20);
    expect(stats.bonusDefense).toBe(8);
    expect(stats.bonusHealth).toBe(25);
  });

  it('TDD Criteria: Equipping an item successfully modifies the player combat stats', () => {
    const inputManager = new InputManager();
    const level = new Level();
    const player = new Player('player-1', 100, 100, inputManager, { level });

    const baseMaxHp = player.maxHealth;

    const epicArmor = new Item({
      id: 'epic-plate',
      name: 'Plate Armor',
      baseId: 'armor_plate',
      slot: 'armor',
      rarity: 'rare',
      level: 2,
      stats: { defense: 15, healthBonus: 50 },
      color: '0x0070dd',
    });

    player.inventoryManager.addItem(epicArmor);
    player.inventoryManager.equip(epicArmor);
    player.refreshEquippedStats();

    // Health increased by healthBonus
    expect(player.maxHealth).toBe(baseMaxHp + 50);

    // Incoming damage reduced by defense
    const taken = player.takeDamage(20);
    expect(taken).toBe(5); // 20 - 15 defense = 5 damage
  });
});
