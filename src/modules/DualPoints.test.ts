import { describe, it, expect } from 'vitest';
import { ProgressionManager } from './Progression';
import { Player } from './Player';
import { InputManager } from '../engine/InputManager';
import { Level } from './Level';

describe('Phase 35: Dual Point System', () => {
  it('TDD Criteria: Level increment event accurately dispatches additions to both point pools', () => {
    const progression = new ProgressionManager();

    expect(progression.level).toBe(1);
    expect(progression.attributePoints).toBe(0);
    expect(progression.skillPoints).toBe(0);

    // Gain enough XP for Level 2 (requires 50 XP)
    progression.addXP(50);
    expect(progression.level).toBe(2);
    expect(progression.attributePoints).toBe(1);
    expect(progression.skillPoints).toBe(1);
  });

  it('accurately increments both pools across multiple level advancements in a single grant', () => {
    const progression = new ProgressionManager();

    // Grant enough XP to advance multiple levels
    progression.addXP(300);
    expect(progression.level).toBeGreaterThanOrEqual(3);
    const levelsGained = progression.level - 1;

    expect(progression.attributePoints).toBe(levelsGained);
    expect(progression.skillPoints).toBe(levelsGained);
  });

  it('allocates attribute points and updates player stats', () => {
    const level = new Level();
    const inputManager = new InputManager();
    const player = new Player('player-1', 100, 100, inputManager, { level });

    player.addXP(50); // Level 2: 1 attribute point, 1 skill point
    expect(player.attributePoints).toBe(1);
    expect(player.skillPoints).toBe(1);

    const initialMaxHealth = player.maxHealth;

    // Allocate 1 Vitality point -> grants +15 Max HP
    const allocated = player.progression.allocateAttribute('vitality');
    expect(allocated).toBe(true);
    expect(player.attributePoints).toBe(0);
    player.refreshEquippedStats();

    expect(player.maxHealth).toBe(initialMaxHealth + 15);
  });
});
