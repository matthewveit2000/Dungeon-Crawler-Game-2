import { describe, it, expect } from 'vitest';
import { InventoryOverlay } from './InventoryOverlay';
import { Inventory } from '../modules/Inventory';
import { Item } from '../modules/Item';

describe('Phase 27: InventoryOverlay', () => {
  it('renders inventory content and equipment bonuses', () => {
    const overlay = new InventoryOverlay({ screenWidth: 800, screenHeight: 600 });
    const inv = new Inventory();

    const sword = new Item({
      id: 'sword-1',
      name: 'Greatsword',
      baseId: 'sword',
      slot: 'weapon',
      rarity: 'rare',
      level: 2,
      stats: { damage: 30 },
      color: '0x0070dd',
    });
    inv.addItem(sword);
    inv.equip(sword);

    expect(overlay.isVisible).toBe(false);

    overlay.show(inv, 800, 600);
    expect(overlay.isVisible).toBe(true);
    expect(overlay.displayedText).toContain('Greatsword');
    expect(overlay.displayedText).toContain('+30 Damage');

    overlay.hide();
    expect(overlay.isVisible).toBe(false);
  });
});
