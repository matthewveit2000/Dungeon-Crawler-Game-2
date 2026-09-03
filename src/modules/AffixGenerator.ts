import { Rng } from '../engine/Rng';
import { ItemRarity, ItemStats } from './Item';
import affixesPack from '../packs/Affixes.json';

export interface Affix {
  id: string;
  name: string;
  type: 'prefix' | 'suffix';
  description: string;
  stats?: ItemStats;
}

/**
 * AffixGenerator — generates chaotic, game-altering modifiers on items based on rarity.
 *
 * Tier 2. Strictly adheres to Tier 3 rarity counts (Common: 0, Uncommon: 1, Rare: 2, Legendary: 4).
 * Driven by injected seeded Rng for 100% reproducible drop properties.
 */
export class AffixGenerator {
  private readonly rng: Rng;

  constructor(rng: Rng = Rng.random()) {
    this.rng = rng;
  }

  public generateAffixes(rarity: ItemRarity): Affix[] {
    const counts = affixesPack.affixCounts as Record<ItemRarity, number>;
    const targetCount = counts[rarity] ?? 0;
    if (targetCount <= 0) return [];

    const pool: Affix[] = [...(affixesPack.pool as Affix[])];
    const chosen: Affix[] = [];

    // Fisher-Yates or partial shuffle with injected RNG to pick targetCount distinct affixes
    for (let i = 0; i < targetCount && pool.length > 0; i++) {
      const idx = this.rng.nextInt(pool.length);
      chosen.push(pool[idx]);
      pool.splice(idx, 1);
    }

    return chosen;
  }
}
