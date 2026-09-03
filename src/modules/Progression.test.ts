import { describe, it, expect } from 'vitest';
import { ProgressionManager } from './Progression';
import { Player } from './Player';
import { InputManager } from '../engine/InputManager';
import { Level } from './Level';
import progressionPack from '../packs/Progression.json';

describe('Phase 34: XP & Leveling Framework', () => {
  it('TDD Criteria: XP threshold formula calculates correctly; level increments upon XP exceeding threshold', () => {
    const progression = new ProgressionManager();

    expect(progression.level).toBe(1);
    expect(progression.currentXP).toBe(0);

    // Formula: Math.floor(baseXP * (level ^ 1.5))
    // Level 1: Math.floor(50 * (1 ^ 1.5)) = 50
    const expectedLevel1Threshold = Math.floor(
      progressionPack.baseXP * Math.pow(1, progressionPack.exponent),
    );
    expect(progression.xpToNextLevel).toBe(expectedLevel1Threshold);
    expect(expectedLevel1Threshold).toBe(50);

    // Add 25 XP (partial progress)
    const res1 = progression.addXP(25);
    expect(res1.leveledUp).toBe(false);
    expect(progression.level).toBe(1);
    expect(progression.currentXP).toBe(25);

    // Add 30 XP (total 55 XP -> triggers level up, 5 XP carries over)
    const res2 = progression.addXP(30);
    expect(res2.leveledUp).toBe(true);
    expect(res2.newLevel).toBe(2);
    expect(progression.level).toBe(2);
    expect(progression.currentXP).toBe(5);

    // Level 2 threshold: Math.floor(50 * (2 ^ 1.5)) = Math.floor(50 * 2.8284) = 141
    const expectedLevel2Threshold = Math.floor(
      progressionPack.baseXP * Math.pow(2, progressionPack.exponent),
    );
    expect(progression.xpToNextLevel).toBe(expectedLevel2Threshold);
    expect(expectedLevel2Threshold).toBe(141);
  });

  it('handles multi-level overflow when granting large amounts of XP', () => {
    const progression = new ProgressionManager();
    const result = progression.addXP(500);

    expect(result.leveledUp).toBe(true);
    expect(progression.level).toBeGreaterThan(2);
    expect(progression.currentXP).toBeLessThan(progression.xpToNextLevel);
  });

  it('Player integrates progression and gains XP', () => {
    const level = new Level();
    const inputManager = new InputManager();
    const player = new Player('player-1', 100, 100, inputManager, { level });

    expect(player.level).toBe(1);
    expect(player.xp).toBe(0);

    player.addXP(60);
    expect(player.level).toBe(2);
    expect(player.xp).toBe(10);
  });
});
