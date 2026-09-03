import { Item, ItemSlot } from './Item';

export interface BonusStats {
  bonusDamage: number;
  bonusDefense: number;
  bonusHealth: number;
}

/**
 * Inventory — manages player backpack items and equipped gear slots.
 *
 * Tier 2. Calculates aggregate bonus stats from equipped weapon and armor.
 * Holds no rendering framework dependencies.
 */
export class Inventory {
  public equippedWeapon: Item | null = null;
  public equippedArmor: Item | null = null;
  public readonly items: Item[] = [];

  public addItem(item: Item): void {
    this.items.push(item);
  }

  public removeItem(id: string): Item | null {
    const idx = this.items.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    return this.items.splice(idx, 1)[0];
  }

  public equip(item: Item): { success: boolean; unequipped: Item | null } {
    let unequipped: Item | null = null;

    if (item.slot === 'weapon') {
      unequipped = this.equippedWeapon;
      this.equippedWeapon = item;
    } else if (item.slot === 'armor') {
      unequipped = this.equippedArmor;
      this.equippedArmor = item;
    } else {
      return { success: false, unequipped: null };
    }

    // Remove item from bag
    const idx = this.items.indexOf(item);
    if (idx !== -1) {
      this.items.splice(idx, 1);
    }

    // If something was unequipped, return it to the bag
    if (unequipped) {
      this.items.push(unequipped);
    }

    return { success: true, unequipped };
  }

  public unequip(slot: ItemSlot): Item | null {
    let unequipped: Item | null = null;
    if (slot === 'weapon' && this.equippedWeapon) {
      unequipped = this.equippedWeapon;
      this.equippedWeapon = null;
    } else if (slot === 'armor' && this.equippedArmor) {
      unequipped = this.equippedArmor;
      this.equippedArmor = null;
    }

    if (unequipped) {
      this.items.push(unequipped);
    }
    return unequipped;
  }

  public getEffectiveBonusStats(): BonusStats {
    let bonusDamage = 0;
    let bonusDefense = 0;
    let bonusHealth = 0;

    const equipped = [this.equippedWeapon, this.equippedArmor].filter((i): i is Item => i !== null);
    for (const item of equipped) {
      if (item.stats.damage) bonusDamage += item.stats.damage;
      if (item.stats.defense) bonusDefense += item.stats.defense;
      if (item.stats.healthBonus) bonusHealth += item.stats.healthBonus;
    }

    return { bonusDamage, bonusDefense, bonusHealth };
  }
}
