import { Entity } from '../engine/Entity';
import { Player } from './Player';
import { Item, ItemRarity } from './Item';
import economyPack from '../packs/Economy.json';
import worldPack from '../packs/World.json';

export interface VendorStockItem {
  id: string;
  name: string;
  cost: number;
  type: string;
  slot?: string;
  rarity?: string;
  damage?: number;
  defense?: number;
  healthBonus?: number;
  healAmount?: number;
}

/**
 * Vendor — trade merchant NPC situated within Sanctuary Haven.
 *
 * Tier 2. Manages shop catalog, purchase validation, and equipment buybacks.
 * Extends Entity for world placement without importing PixiJS directly.
 */
export class Vendor extends Entity {
  public readonly stock: VendorStockItem[];

  constructor(id: string, x: number, y: number, tileSize = worldPack.tileSize) {
    const size = Math.round(tileSize * 0.75);

    super(id, x, y, {
      width: size,
      height: size,
      color: 0xccaa44, // Golden merchant garb
    });

    this.stock = economyPack.vendorStock as VendorStockItem[];
  }

  public buy(
    player: Player,
    itemId: string,
  ): { success: boolean; reason?: string; item?: VendorStockItem } {
    const item = this.stock.find((s) => s.id === itemId);
    if (!item) {
      return { success: false, reason: 'Item not found in stock' };
    }

    if (player.gold < item.cost) {
      return { success: false, reason: 'Insufficient funds' };
    }

    player.gold -= item.cost;

    if (item.type === 'potion' && item.healAmount) {
      player.heal(item.healAmount);
    } else if (item.type === 'equipment' && item.slot) {
      const equipItem = new Item({
        id: `vendor-${item.id}-${Date.now()}`,
        name: item.name,
        baseId: item.id,
        slot: item.slot as any,
        rarity: (item.rarity ?? 'common') as ItemRarity,
        level: 1,
        stats: {
          damage: item.damage,
          defense: item.defense,
          healthBonus: item.healthBonus,
        },
        color: '0x1eff00',
      });
      player.inventoryManager.addItem(equipItem);
    }

    return { success: true, item };
  }

  public sell(player: Player, itemIndex: number): { success: boolean; goldEarned: number } {
    const item = player.inventoryManager.items[itemIndex];
    if (!item) {
      return { success: false, goldEarned: 0 };
    }

    player.inventoryManager.removeItem(item.id);

    const prices = economyPack.sellPrices as Record<string, number>;
    const goldEarned = prices[item.rarity] ?? 10;
    player.gold += goldEarned;

    return { success: true, goldEarned };
  }

  public override update(_dt: number): void {
    this.syncView();
  }
}
