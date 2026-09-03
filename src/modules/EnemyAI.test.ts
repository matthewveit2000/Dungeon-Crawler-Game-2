import { describe, it, expect } from 'vitest';
import { Enemy } from './Enemy';
import { Entity } from '../engine/Entity';
import { Level } from './Level';
import enemiesPack from '../packs/Enemies.json';

class DummyTarget extends Entity {
  constructor(id: string, x: number, y: number) {
    super(id, x, y);
    this.health = 100;
  }
  public override update(): void {}
}

describe('Phase 22: Enemy Aggro Radius & Pathfinding', () => {
  it('initializes in IDLE state', () => {
    const enemy = new Enemy('goblin-1', 'goblin', 0, 0);
    expect(enemy.state).toBe('IDLE');
    expect(enemy.aggroRadius).toBe(enemiesPack.types.goblin.aggroRadius);
  });

  it('remains IDLE when target is outside aggro radius', () => {
    const enemy = new Enemy('goblin-1', 'goblin', 0, 0);
    const target = new DummyTarget('target', 500, 500); // Distance ~707px > 160px
    enemy.setTarget(target);

    enemy.update(0.016);

    expect(enemy.state).toBe('IDLE');
    expect(enemy.x).toBe(0);
    expect(enemy.y).toBe(0);
  });

  it('shifts state from IDLE to AGGRO when target enters aggro radius', () => {
    const enemy = new Enemy('goblin-1', 'goblin', 0, 0);
    const target = new DummyTarget('target', 100, 0); // Distance 100px < 160px
    enemy.setTarget(target);

    enemy.update(0.016);

    expect(enemy.state).toBe('AGGRO');
  });

  it('moves towards target when in AGGRO state', () => {
    const enemy = new Enemy('goblin-1', 'goblin', 0, 0);
    const target = new DummyTarget('target', 100, 0);
    enemy.setTarget(target);

    enemy.update(0.1); // 0.1s * 80 speed = 8px move towards target

    expect(enemy.state).toBe('AGGRO');
    expect(enemy.x).toBeCloseTo(8, 1);
    expect(enemy.y).toBeCloseTo(0, 1);
  });

  it('moves diagonally when target is positioned at an angle on open floor', () => {
    const level = new Level({ width: 10, height: 10, steps: 10, seed: 1234 });
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        level.grid.set(x, y, 1);
      }
    }
    const ts = level.tileSize;
    const enemy = new Enemy('goblin-1', 'goblin', 2 * ts, 2 * ts, { level, tileSize: ts });
    const target = new DummyTarget('target', 5 * ts, 5 * ts);
    enemy.setTarget(target);

    const startX = enemy.x;
    const startY = enemy.y;

    enemy.update(0.1);

    // Both X and Y must increase simultaneously (diagonal motion)
    expect(enemy.x).toBeGreaterThan(startX);
    expect(enemy.y).toBeGreaterThan(startY);
    expect(enemy.x - startX).toBeCloseTo(enemy.y - startY, 1);
  });

  it('does not walk through level walls when pursuing target', () => {
    // 10x10 map with walls
    const level = new Level({ width: 10, height: 10, steps: 10, seed: 1234 });
    const tileSize = level.tileSize;
    const spawn = level.spawnPoint;

    const enemy = new Enemy('goblin-1', 'goblin', spawn.x, spawn.y, { level, tileSize });
    const target = new DummyTarget('target', spawn.x + tileSize * 3, spawn.y);
    enemy.setTarget(target);

    // Mock wall collision 1 tile to the right of the enemy
    const wallX = spawn.x + tileSize;
    level.isCollidingWithWall = (x, _y, w, _h) => {
      if (x + w > wallX) return true;
      return false;
    };

    // Attempt to move right into the wall
    for (let i = 0; i < 10; i++) {
      enemy.update(0.1);
    }

    // Enemy should be stopped by the wall boundary and not tunnel through
    expect(enemy.x + enemy.width).toBeLessThanOrEqual(wallX);
  });

  it('stops pursuing when reaching contact proximity with target', () => {
    const enemy = new Enemy('goblin-1', 'goblin', 0, 0);
    const target = new DummyTarget('target', 2, 0); // Already overlapping
    enemy.setTarget(target);

    const startX = enemy.x;
    enemy.update(0.1);

    // Should not overshoot or oscillate directly inside target center
    expect(Math.abs(enemy.x - startX)).toBeLessThan(1);
  });

  it('navigates around an L-shaped corner obstacle instead of getting stuck', () => {
    const level = new Level({ width: 6, height: 6, steps: 1, seed: 1 });
    for (let y = 0; y < 6; y++) {
      for (let x = 0; x < 6; x++) {
        level.grid.set(x, y, 0); // Wall
      }
    }

    // Carve corridor: (1,1) -> (1,2) -> (2,2) -> (3,2) -> (3,1)
    // Wall is at (2,1), directly between (1,1) and (3,1)
    level.grid.set(1, 1, 1); // Floor
    level.grid.set(1, 2, 1);
    level.grid.set(2, 2, 1);
    level.grid.set(3, 2, 1);
    level.grid.set(3, 1, 1);

    const ts = level.tileSize;
    const enemy = new Enemy('goblin-1', 'goblin', 1 * ts + ts / 2, 1 * ts + ts / 2, {
      level,
      tileSize: ts,
    });
    const target = new DummyTarget('target', 3 * ts + ts / 2, 1 * ts + ts / 2);
    enemy.setTarget(target);

    // Update multiple frames
    for (let i = 0; i < 40; i++) {
      enemy.update(0.05);
    }

    // Direct line was blocked at (2,1). With pathfinding, enemy navigates down
    // to y >= 2*ts to go around the wall corner and reaches x > 2*ts!
    expect(enemy.y).toBeGreaterThan(1.5 * ts);
    expect(enemy.x).toBeGreaterThan(2 * ts);
  });
});
