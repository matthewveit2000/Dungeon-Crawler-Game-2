import { describe, it, expect } from 'vitest';
import { Enemy } from './Enemy';
import { Player } from './Player';
import { Level } from './Level';
import { InputManager } from '../engine/InputManager';

describe('Phase 29: City De-Aggro AI Directives', () => {
  it('TDD Criteria: Player intersecting safe zone tile forces all active enemy states to FLEE', () => {
    const level = new Level({ seed: 42 });
    const inputManager = new InputManager();

    expect(level.cityBounds).toBeDefined();
    const cityCenter = level.cityBounds!.center;

    // Spawn player outside safe zone
    const player = new Player('player-1', cityCenter.x + 300, cityCenter.y + 300, inputManager, {
      level,
    });

    // Spawn enemy close to player outside safe zone
    const enemy = new Enemy('goblin-1', 'goblin', player.x + 40, player.y, { level });
    enemy.setTarget(player);

    // Initial update outside safe zone -> enters AGGRO
    enemy.update(0.1);
    expect(enemy.state).toBe('AGGRO');

    // Move player inside safe zone
    player.x = cityCenter.x;
    player.y = cityCenter.y;
    player.syncView();
    expect(level.isSafeZone(player.x, player.y)).toBe(true);

    // Update enemy while player is inside safe zone -> must drop aggro and transition to FLEE
    enemy.update(0.1);
    expect(enemy.state).toBe('FLEE');
  });

  it('fleeing enemy moves away from safe zone / player coordinates', () => {
    const level = new Level({ seed: 42 });
    const inputManager = new InputManager();
    const cityCenter = level.cityBounds!.center;

    const player = new Player('player-1', cityCenter.x, cityCenter.y, inputManager, { level });
    const startEnemyX = cityCenter.x + 100;
    const startEnemyY = cityCenter.y;

    const enemy = new Enemy('goblin-2', 'goblin', startEnemyX, startEnemyY, { level });
    enemy.setTarget(player);

    enemy.update(0.5);
    expect(enemy.state).toBe('FLEE');
    // Enemy should have moved further away from player (X increased)
    expect(enemy.x).toBeGreaterThan(startEnemyX);
  });
});
