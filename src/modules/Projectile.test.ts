import { describe, it, expect } from 'vitest';
import { Projectile } from './Projectile';
import { Entity } from '../engine/Entity';
import { Level } from './Level';

class DummyTarget extends Entity {
  constructor(id: string, x: number, y: number, width = 16, height = 16) {
    super(id, x, y, { width, height, color: 0xffffff });
    this.health = 50;
    this.maxHealth = 50;
  }
  public override update(): void {}
}

describe('Projectile (Tier 2)', () => {
  it('moves along its direction vector at configured speed', () => {
    const proj = new Projectile('p1', 0, 0, {
      dirX: 1,
      dirY: 0,
      speed: 100,
      damage: 15,
      maxRange: 200,
    });

    proj.update(0.1); // 100 * 0.1 = 10px

    expect(proj.x).toBeCloseTo(10, 1);
    expect(proj.y).toBeCloseTo(0, 1);
    expect(proj.isDestroyed).toBe(false);
  });

  it('destroys itself after exceeding maxRange', () => {
    const proj = new Projectile('p1', 0, 0, {
      dirX: 1,
      dirY: 0,
      speed: 100,
      damage: 15,
      maxRange: 50,
    });

    proj.update(0.6); // 60px > 50px maxRange

    expect(proj.isDestroyed).toBe(true);
  });

  it('destroys itself on collision with a solid level wall', () => {
    const level = new Level({ width: 10, height: 10, steps: 10, seed: 1234 });

    // Mock wall at x >= 20
    level.isCollidingWithWall = (x) => x >= 20;

    const proj = new Projectile('p1', 0, 0, {
      dirX: 1,
      dirY: 0,
      speed: 100,
      damage: 15,
      maxRange: 200,
      level,
    });

    proj.update(0.1); // at 10px, no wall
    expect(proj.isDestroyed).toBe(false);

    proj.update(0.15); // at 25px, hits wall
    expect(proj.isDestroyed).toBe(true);
  });

  it('damages an intersecting entity and destroys itself', () => {
    const proj = new Projectile('p1', 0, 0, {
      dirX: 1,
      dirY: 0,
      speed: 100,
      damage: 20,
      maxRange: 200,
    });

    const target = new DummyTarget('target', 5, 0); // Overlapping
    const hit = proj.checkCollisionWith(target);

    expect(hit).toBe(true);
    expect(target.health).toBe(30); // 50 - 20 = 30
    expect(proj.isDestroyed).toBe(true);
  });
});
