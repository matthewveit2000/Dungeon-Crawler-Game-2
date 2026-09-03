import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { Player } from '../modules/Player';
import { AttributeKey, SkillKey } from '../modules/Progression';

export interface ProgressionOverlayOptions {
  screenWidth?: number;
  screenHeight?: number;
}

/**
 * ProgressionOverlay — character sheet and allocation menu for attributes and skill trees.
 *
 * Tier 1. Renders player level, experience, available points, and node choices.
 */
export class ProgressionOverlay {
  public readonly view: Container;
  private readonly backdrop: Graphics;
  private readonly titleText: Text;
  private readonly contentText: Text;
  private readonly player: Player;

  constructor(player: Player, options: ProgressionOverlayOptions = {}) {
    this.player = player;
    this.view = new Container();
    this.view.visible = false;

    const width = options.screenWidth ?? 800;
    const height = options.screenHeight ?? 600;

    this.backdrop = new Graphics();
    this.backdrop.rect(0, 0, width, height);
    this.backdrop.fill({ color: 0x070b19, alpha: 0.9 });
    this.view.addChild(this.backdrop);

    const titleStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 24,
      fill: 0x00ffff,
      fontWeight: 'bold',
    });

    this.titleText = new Text({
      text: '=== CHARACTER PROGRESSION (Press P to Close) ===',
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

    this.render();
  }

  public get visible(): boolean {
    return this.view.visible;
  }

  public set visible(val: boolean) {
    this.view.visible = val;
    if (val) this.render();
  }

  public get isVisible(): boolean {
    return this.view.visible;
  }

  public toggleVisibility(): boolean {
    this.visible = !this.visible;
    return this.visible;
  }

  public get displayedText(): string {
    return this.contentText.text;
  }

  public spendAttribute(name: AttributeKey): boolean {
    const success = this.player.progression.allocateAttribute(name);
    if (success) {
      this.player.refreshEquippedStats();
      this.render();
    }
    return success;
  }

  public spendSkill(name: SkillKey): boolean {
    const success = this.player.progression.allocateSkill(name);
    if (success) {
      this.player.refreshEquippedStats();
      this.render();
    }
    return success;
  }

  public render(): void {
    const p = this.player;
    const prog = p.progression;
    const bonuses = prog.getBonusStats();

    const lines: string[] = [
      `Level: ${prog.level}   |   XP: ${prog.currentXP} / ${prog.xpToNextLevel}`,
      `Attribute Points Available: [ ${prog.attributePoints} ]   |   Skill Points Available: [ ${prog.skillPoints} ]`,
      '',
      '--- CORE ATTRIBUTES ---',
      `[1] Strength: ${prog.attributes.strength} points (+${bonuses.bonusDamage} Flat Attack Damage)`,
      `[2] Vitality: ${prog.attributes.vitality} points (+${bonuses.bonusHealth} Max Health)`,
      `[3] Agility:  ${prog.attributes.agility} points (+${prog.attributes.agility * 5}% Movement Speed)`,
      '',
      '--- PASSIVE SKILL NODES ---',
      `[4] Whirlwind Strike : Rank ${prog.skills.whirlwind} / 3 (+${prog.skills.whirlwind * 20}% Melee Area)`,
      `[5] Stone Skin       : Rank ${prog.skills.stoneSkin} / 3 (+${bonuses.bonusDefense} Flat Armor Defense)`,
      `[6] Swiftness        : Rank ${prog.skills.swiftness} / 3 (+${prog.skills.swiftness * 10}% Movement Speed)`,
      '',
      '--- CURRENT PLAYER TOTALS ---',
      `Max HP: ${p.maxHealth}   |   Current HP: ${p.health}   |   Gold: ${p.gold}`,
      `Total Flat Defense: ${p.inventoryManager.getEffectiveBonusStats().bonusDefense + bonuses.bonusDefense}`,
    ];

    this.contentText.text = lines.join('\n');
  }

  public resize(screenWidth: number, screenHeight: number): void {
    this.backdrop.clear();
    this.backdrop.rect(0, 0, screenWidth, screenHeight);
    this.backdrop.fill({ color: 0x070b19, alpha: 0.9 });
  }
}
