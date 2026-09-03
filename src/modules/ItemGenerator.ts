import { Rng } from '../engine/Rng';
import { Item, ItemRarity, ItemSlot, ItemStats } from './Item';
import { AffixGenerator } from './AffixGenerator';
import itemsPack from '../packs/Items.json';

export interface GenerateItemOptions {
  level?: number;
  rarity?: ItemRarity;
  slot?: ItemSlot;
  baseId?: string;
}

interface BaseItemDef {
  id: string;
  name: string;
  slot: string;
  baseStats: {
    damage?: number;
    defense?: number;
    healthBonus?: number;
  };
}

/**
 * ItemGenerator — creates procedurally generated ARPG equipment and loot.
 *
 * Tier 2. Operates using injected Rng to maintain complete determinism across runs.
 * Applies multiplicative scaling math based on item level and rarity tier.
 */
export class ItemGenerator {
  private readonly rng: Rng;
  private readonly affixGen: AffixGenerator;

  constructor(rng: Rng = Rng.random()) {
    this.rng = rng;
    this.affixGen = new AffixGenerator(this.rng);
  }

  public generateItem(options: GenerateItemOptions = {}): Item {
    const level = Math.max(1, Math.floor(options.level ?? 1));
    const rarity = options.rarity ?? this.rollRarity();
    const rarityDef = (itemsPack.rarities as Record<string, any>)[rarity];

    // Select base item
    const base = this.selectBase(options.baseId, options.slot);

    // Compute scaled base stats
    const stats: ItemStats = {};
    const levelFactor = 1 + (level - 1) * itemsPack.levelScalingFactor;
    const rarityMultiplier = rarityDef.multiplier;

    if (base.baseStats.damage !== undefined) {
      stats.damage = Math.floor(base.baseStats.damage * levelFactor * rarityMultiplier);
    }
    if (base.baseStats.defense !== undefined) {
      stats.defense = Math.floor(base.baseStats.defense * levelFactor * rarityMultiplier);
    }
    if (base.baseStats.healthBonus !== undefined) {
      stats.healthBonus = Math.floor(base.baseStats.healthBonus * levelFactor * rarityMultiplier);
    }

    // Generate affixes for this rarity tier
    const affixes = this.affixGen.generateAffixes(rarity);

    const id = `item-${this.rng.next()}-${Date.now()}`;
    const name = `${rarityDef.name} ${base.name}`;

    return new Item({
      id,
      name,
      baseId: base.id,
      slot: base.slot as ItemSlot,
      rarity,
      level,
      stats,
      color: rarityDef.color,
      affixes,
    });
  }

  private rollRarity(): ItemRarity {
    const rarities = itemsPack.rarities as Record<string, { weight: number }>;
    const totalWeight = Object.values(rarities).reduce((sum, r) => sum + r.weight, 0);
    const roll = this.rng.next() * totalWeight;

    let accumulated = 0;
    for (const [key, def] of Object.entries(rarities)) {
      accumulated += def.weight;
      if (roll <= accumulated) {
        return key as ItemRarity;
      }
    }

    return 'common';
  }

  private selectBase(baseId?: string, slot?: ItemSlot): BaseItemDef {
    const bases = itemsPack.bases as Record<string, BaseItemDef>;

    if (baseId && bases[baseId]) {
      return bases[baseId];
    }

    const eligible = Object.values(bases).filter((b) => !slot || b.slot === slot);
    if (eligible.length === 0) {
      return Object.values(bases)[0];
    }

    const choice = eligible[this.rng.nextInt(eligible.length)];
    return choice;
  }
}
