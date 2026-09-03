import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { Inventory } from '../modules/Inventory';

export interface InventoryOverlayOptions {
  screenWidth: number;
  screenHeight: number;
}

/**
 * InventoryOverlay — visual display for player inventory and equipment.
 *
 * Tier 1. Uses PixiJS graphics and text to render equipped slots and backpack items.
 * Opening this overlay sets simulation speed to 0 to pause game time.
 */
export class InventoryOverlay {
  public readonly view: Container;
  private readonly backdrop: Graphics;
  private readonly titleText: Text;
  private readonly contentText: Text;

  constructor(options: InventoryOverlayOptions) {
    this.view = new Container();
    this.view.visible = false;

    this.backdrop = new Graphics();
    this.backdrop.rect(0, 0, options.screenWidth, options.screenHeight);
    this.backdrop.fill({ color: 0x050510, alpha: 0.85 });
    this.view.addChild(this.backdrop);

    const titleStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 24,
      fill: 0xffd700,
      fontWeight: 'bold',
    });

    this.titleText = new Text({
      text: '=== INVENTORY (Press I to Close) ===',
      style: titleStyle,
    });
    this.titleText.x = 40;
    this.titleText.y = 30;
    this.view.addChild(this.titleText);

    const contentStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 16,
      fill: 0xffffff,
      lineHeight: 24,
    });

    this.contentText = new Text({
      text: '',
      style: contentStyle,
    });
    this.contentText.x = 40;
    this.contentText.y = 80;
    this.view.addChild(this.contentText);
  }

  public get isVisible(): boolean {
    return this.view.visible;
  }

  public get displayedText(): string {
    return this.contentText.text;
  }

  public show(inventory: Inventory, screenWidth: number, screenHeight: number): void {
    this.resize(screenWidth, screenHeight);

    const bonuses = inventory.getEffectiveBonusStats();
    const weaponName = inventory.equippedWeapon
      ? `${inventory.equippedWeapon.name} (+${inventory.equippedWeapon.stats.damage ?? 0} Dmg)`
      : 'None';
    const armorName = inventory.equippedArmor
      ? `${inventory.equippedArmor.name} (+${inventory.equippedArmor.stats.defense ?? 0} Def, +${inventory.equippedArmor.stats.healthBonus ?? 0} HP)`
      : 'None';

    const lines: string[] = [
      '--- EQUIPPED GEAR ---',
      `Weapon: ${weaponName}`,
      `Armor:  ${armorName}`,
      `Total Equipment Bonuses: +${bonuses.bonusDamage} Damage, +${bonuses.bonusDefense} Defense, +${bonuses.bonusHealth} Max HP`,
      '',
      '--- BACKPACK (Stored Items) ---',
    ];

    if (inventory.items.length === 0) {
      lines.push(' (Backpack is empty - defeat monsters to find loot)');
    } else {
      inventory.items.forEach((item, index) => {
        lines.push(` [${index + 1}] ${item.toStatBlock().split('\n').join(' | ')}`);
      });
    }

    this.contentText.text = lines.join('\n');
    this.view.visible = true;
  }

  public hide(): void {
    this.view.visible = false;
  }

  public toggle(inventory: Inventory, screenWidth: number, screenHeight: number): boolean {
    if (this.isVisible) {
      this.hide();
      return false;
    } else {
      this.show(inventory, screenWidth, screenHeight);
      return true;
    }
  }

  public resize(screenWidth: number, screenHeight: number): void {
    this.backdrop.clear();
    this.backdrop.rect(0, 0, screenWidth, screenHeight);
    this.backdrop.fill({ color: 0x050510, alpha: 0.85 });
  }
}
