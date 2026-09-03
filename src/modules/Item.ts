export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'legendary';
export type ItemSlot = 'weapon' | 'armor';

export interface ItemStats {
  damage?: number;
  defense?: number;
  healthBonus?: number;
}

export interface Affix {
  id: string;
  name: string;
  type: 'prefix' | 'suffix';
  description: string;
  stats?: ItemStats;
}

export interface ItemData {
  id: string;
  name: string;
  baseId: string;
  slot: ItemSlot;
  rarity: ItemRarity;
  level: number;
  stats: ItemStats;
  color: string;
  affixes?: Affix[];
}

/**
 * Item — represents a discrete piece of equipment or loot in the dungeon.
 *
 * Tier 2. Holds calculated numerical stats, rarity tier, affixes, and display formatting.
 * Free of rendering framework code.
 */
export class Item {
  public readonly id: string;
  public readonly name: string;
  public readonly baseId: string;
  public readonly slot: ItemSlot;
  public readonly rarity: ItemRarity;
  public readonly level: number;
  public readonly stats: ItemStats;
  public readonly color: string;
  public readonly affixes: Affix[];

  constructor(data: ItemData) {
    this.id = data.id;
    this.name = data.name;
    this.baseId = data.baseId;
    this.slot = data.slot;
    this.rarity = data.rarity;
    this.level = data.level;
    this.stats = { ...data.stats };
    this.color = data.color;
    this.affixes = data.affixes ? [...data.affixes] : [];
  }

  /**
   * Formats the item into a readable multi-line stat block string suitable for
   * UI tooltips and audit console logging.
   */
  public toStatBlock(): string {
    const lines: string[] = [
      `[${this.rarity.toUpperCase()}] ${this.name} (Lv. ${this.level})`,
      `Slot: ${this.slot}`,
    ];

    if (this.stats.damage !== undefined) {
      lines.push(`  Damage: +${this.stats.damage}`);
    }
    if (this.stats.defense !== undefined) {
      lines.push(`  Defense: +${this.stats.defense}`);
    }
    if (this.stats.healthBonus !== undefined) {
      lines.push(`  Max HP: +${this.stats.healthBonus}`);
    }

    if (this.affixes.length > 0) {
      lines.push('  Affixes:');
      for (const affix of this.affixes) {
        lines.push(`   * ${affix.name}: ${affix.description}`);
      }
    }

    return lines.join('\n');
  }
}
