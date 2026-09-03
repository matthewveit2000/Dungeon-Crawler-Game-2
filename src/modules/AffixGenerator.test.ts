import { describe, it, expect } from 'vitest';
import { AffixGenerator } from './AffixGenerator';
import { ItemGenerator } from './ItemGenerator';
import { Rng } from '../engine/Rng';

describe('Phase 25: Affix Generator', () => {
  it('enforces exact affix counts based strictly on rarity tier', () => {
    const gen = new AffixGenerator(new Rng(12345));

    const commonAffixes = gen.generateAffixes('common');
    expect(commonAffixes).toHaveLength(0);

    const uncommonAffixes = gen.generateAffixes('uncommon');
    expect(uncommonAffixes).toHaveLength(1);

    const rareAffixes = gen.generateAffixes('rare');
    expect(rareAffixes).toHaveLength(2);
    // Ensure no duplicate affixes on the same item
    expect(rareAffixes[0].id).not.toBe(rareAffixes[1].id);

    const legendaryAffixes = gen.generateAffixes('legendary');
    expect(legendaryAffixes).toHaveLength(4);
    const uniqueIds = new Set(legendaryAffixes.map((a) => a.id));
    expect(uniqueIds.size).toBe(4);
  });

  it('produces deterministic affixes when given identical seeds', () => {
    const genA = new AffixGenerator(new Rng(98765));
    const genB = new AffixGenerator(new Rng(98765));

    const affixesA = genA.generateAffixes('legendary');
    const affixesB = genB.generateAffixes('legendary');

    expect(affixesA.map((a) => a.id)).toEqual(affixesB.map((a) => a.id));
  });

  it('integrates with ItemGenerator to attach affixes to generated items', () => {
    const itemGen = new ItemGenerator(new Rng(42));
    const legendaryItem = itemGen.generateItem({ rarity: 'legendary' });

    expect(legendaryItem.affixes).toHaveLength(4);
    expect(legendaryItem.toStatBlock()).toContain('Affixes:');
  });
});
