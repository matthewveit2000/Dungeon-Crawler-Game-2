import { Entity } from '../engine/Entity';
import { parseColor } from '../engine/View';
import { Item } from './Item';
import worldPack from '../packs/World.json';

export interface LootDropOptions {
  tileSize?: number;
}

/**
 * LootDrop — physical item dropped onto the dungeon floor.
 *
 * Tier 2. Wraps an Item instance. Color is derived from the item's rarity tier.
 * Does not import pixi.js directly, preserving Tier 1/2 isolation.
 */
export class LootDrop extends Entity {
  public readonly item: Item;
  public isCollected = false;

  constructor(id: string, x: number, y: number, item: Item, options: LootDropOptions = {}) {
    const tileSize = options.tileSize ?? worldPack.tileSize;
    const size = Math.round(tileSize * 0.5); // 16px at 32px tiles

    super(id, x, y, {
      width: size,
      height: size,
      color: parseColor(item.color),
    });

    this.item = item;
  }

  public collect(): void {
    this.isCollected = true;
  }

  public override update(_dt: number): void {
    this.syncView();
  }
}
