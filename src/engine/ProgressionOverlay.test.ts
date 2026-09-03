import { describe, it, expect } from 'vitest';
import { ProgressionOverlay } from './ProgressionOverlay';
import { Player } from '../modules/Player';
import { Level } from '../modules/Level';
import { InputManager } from './InputManager';

describe('Phase 36: Attribute & Skill Allocation Menus', () => {
  it('TDD Criteria: Spending points deducts total and permanently applies stat modifiers', () => {
    const level = new Level();
    const inputManager = new InputManager();
    const player = new Player('player-1', 100, 100, inputManager, { level });

    // Grant enough XP for Level 2 (1 attribute point, 1 skill point)
    player.addXP(50);
    expect(player.attributePoints).toBe(1);
    expect(player.skillPoints).toBe(1);

    const overlay = new ProgressionOverlay(player);
    expect(overlay.visible).toBe(false);

    overlay.toggleVisibility();
    expect(overlay.visible).toBe(true);

    const initialMaxHealth = player.maxHealth;
    // Spend attribute point on vitality
    const successAttr = overlay.spendAttribute('vitality');
    expect(successAttr).toBe(true);
    expect(player.attributePoints).toBe(0);
    expect(player.maxHealth).toBe(initialMaxHealth + 15);

    // Spend skill point on stoneSkin
    const successSkill = overlay.spendSkill('stoneSkin');
    expect(successSkill).toBe(true);
    expect(player.skillPoints).toBe(0);
    expect(player.progression.skills.stoneSkin).toBe(1);
    expect(player.progression.getBonusStats().bonusDefense).toBe(5);

    // Further spending fails when points are 0
    expect(overlay.spendAttribute('strength')).toBe(false);
    expect(overlay.spendSkill('swiftness')).toBe(false);
  });
});
