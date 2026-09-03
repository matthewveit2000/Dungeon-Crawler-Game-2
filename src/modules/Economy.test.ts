import { describe, it, expect } from 'vitest';
import { Vendor } from './Vendor';
import { Player } from './Player';
import { Item } from './Item';
import { InputManager } from '../engine/InputManager';
import { Level } from './Level';

describe('Phase 30: Economy & Vendor NPCs', () => {
  it('TDD Criteria: Buying an item deducts the exact currency amount; transaction fails if funds are insufficient', () => {
    const inputManager = new InputManager();
    const level = new Level();
    const player = new Player('player-1', 100, 100, inputManager, { level });
    const vendor = new Vendor('vendor-1', 100, 100);

    // Initial gold is 0
    expect(player.gold).toBe(0);

    // Attempt purchase without funds -> must fail
    const failedPurchase = vendor.buy(player, 'potion_health');
    expect(failedPurchase.success).toBe(false);
    expect(failedPurchase.reason).toBe('Insufficient funds');
    expect(player.gold).toBe(0);

    // Give player exact funds for potion (25 gold)
    player.gold = 25;
    const successPurchase = vendor.buy(player, 'potion_health');
    expect(successPurchase.success).toBe(true);
    expect(player.gold).toBe(0);
  });

  it('selling loot to the vendor awards currency based on item rarity', () => {
    const inputManager = new InputManager();
    const level = new Level();
    const player = new Player('player-1', 100, 100, inputManager, { level });
    const vendor = new Vendor('vendor-1', 100, 100);

    const rareItem = new Item({
      id: 'rare-gem',
      name: 'Rare Ring',
      baseId: 'sword',
      slot: 'weapon',
      rarity: 'rare',
      level: 1,
      stats: { damage: 10 },
      color: '0x0070dd',
    });

    player.inventoryManager.addItem(rareItem);
    expect(player.inventoryManager.items).toHaveLength(1);

    const result = vendor.sell(player, 0);
    expect(result.success).toBe(true);
    expect(result.goldEarned).toBe(60); // Rare sell price in Economy.json
    expect(player.gold).toBe(60);
    expect(player.inventoryManager.items).toHaveLength(0);
  });

  it('buying a health potion restores player health', () => {
    const inputManager = new InputManager();
    const level = new Level();
    const player = new Player('player-1', 100, 100, inputManager, { level });
    const vendor = new Vendor('vendor-1', 100, 100);

    player.takeDamage(60); // HP: 40/100
    expect(player.health).toBe(40);

    player.gold = 50;
    vendor.buy(player, 'potion_health');

    // Restores 50 HP -> 40 + 50 = 90
    expect(player.health).toBe(90);
    expect(player.gold).toBe(25);
  });
});
