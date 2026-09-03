import { describe, it, expect } from 'vitest';
import { ItemGenerator } from './ItemGenerator';
import { Rng } from '../engine/Rng';
import itemsPack from '../packs/Items.json';

describe('ItemGenerator (Phase 24: Loot Generation & Economy Math)', () => {
  it('instantiates generator with injected Rng', () => {
    const rng = new Rng(12345);
    const generator = new ItemGenerator(rng);
    expect(generator).toBeDefined();
  });

  it('generates item with correct base stats for Level 1 Common item', () => {
    const rng = new Rng(12345);
    const generator = new ItemGenerator(rng);

    const item = generator.generateItem({
      level: 1,
      rarity: 'common',
      baseId: 'sword',
    });

    expect(item.id).toBeDefined();
    expect(item.name).toBe('Common Sword');
    expect(item.level).toBe(1);
    expect(item.rarity).toBe('common');
    expect(item.slot).toBe('weapon');
    expect(item.stats.damage).toBe(itemsPack.bases.sword.baseStats.damage);
  });

  it('TDD Criteria: Level 5 Legendary item outputs strictly higher stats than Level 1 Common item', () => {
    const rng = new Rng(12345);
    const generator = new ItemGenerator(rng);

    const commonL1 = generator.generateItem({
      level: 1,
      rarity: 'common',
      baseId: 'sword',
    });

    const legendaryL5 = generator.generateItem({
      level: 5,
      rarity: 'legendary',
      baseId: 'sword',
    });

    // Level 1 Common: 15 * (1 + 0) * 1.0 = 15
    // Level 5 Legendary: 15 * (1 + 4 * 0.2) * 3.0 = 15 * 1.8 * 3.0 = 81
    expect(legendaryL5.stats.damage).toBeGreaterThan(commonL1.stats.damage!);
    expect(legendaryL5.stats.damage).toBe(81);
    expect(commonL1.stats.damage).toBe(15);
  });

  it('applies armor stats scaling for defense and health bonus', () => {
    const rng = new Rng(12345);
    const generator = new ItemGenerator(rng);

    const plateCommon = generator.generateItem({
      level: 1,
      rarity: 'common',
      baseId: 'armor_plate',
    });

    const plateRareL3 = generator.generateItem({
      level: 3,
      rarity: 'rare',
      baseId: 'armor_plate',
    });

    // Rare multiplier = 2.0. Level 3 = (1 + 2 * 0.2) = 1.4. Total scale = 2.8x
    expect(plateRareL3.stats.defense).toBe(Math.floor(18 * 1.4 * 2.0));
    expect(plateRareL3.stats.healthBonus).toBe(Math.floor(75 * 1.4 * 2.0));
    expect(plateRareL3.stats.defense).toBeGreaterThan(plateCommon.stats.defense!);
  });

  it('produces 100% deterministic outputs with identical seeds', () => {
    const gen1 = new ItemGenerator(new Rng(9999));
    const gen2 = new ItemGenerator(new Rng(9999));

    const item1 = gen1.generateItem({ level: 3 });
    const item2 = gen2.generateItem({ level: 3 });

    expect(item1.baseId).toBe(item2.baseId);
    expect(item1.rarity).toBe(item2.rarity);
    expect(item1.stats).toEqual(item2.stats);
  });

  it('formats readable stat block string for audit logging', () => {
    const rng = new Rng(12345);
    const generator = new ItemGenerator(rng);

    const item = generator.generateItem({
      level: 2,
      rarity: 'rare',
      baseId: 'bow',
    });

    const block = item.toStatBlock();
    expect(block).toContain('Rare Bow (Lv. 2)');
    expect(block).toContain('Slot: weapon');
    expect(block).toContain('Damage:');
  });
});
