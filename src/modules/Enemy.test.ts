import { describe, it, expect } from 'vitest';
import { Enemy } from './Enemy';
import enemiesPack from '../packs/Enemies.json';

describe('Enemy', () => {
  it('instantiates with correct stats from Enemies.json for goblin', () => {
    const enemy = new Enemy('goblin-1', 'goblin', 100, 200);
    const def = enemiesPack.types.goblin;

    expect(enemy.enemyType).toBe('goblin');
    expect(enemy.maxHealth).toBe(def.health);
    expect(enemy.health).toBe(def.health);
    expect(enemy.speed).toBe(def.speed);
    expect(enemy.damage).toBe(def.damage);
    expect(enemy.isAlive).toBe(true);
  });

  it('instantiates with correct stats for skeleton and rat', () => {
    const skeleton = new Enemy('skel-1', 'skeleton', 0, 0);
    expect(skeleton.maxHealth).toBe(enemiesPack.types.skeleton.health);
    expect(skeleton.damage).toBe(enemiesPack.types.skeleton.damage);

    const rat = new Enemy('rat-1', 'rat', 0, 0);
    expect(rat.maxHealth).toBe(enemiesPack.types.rat.health);
    expect(rat.speed).toBe(enemiesPack.types.rat.speed);
  });

  it('reduces health on damage and dies when health reaches zero', () => {
    const enemy = new Enemy('goblin-1', 'goblin', 0, 0);
    enemy.takeDamage(10);
    expect(enemy.health).toBe(20);
    expect(enemy.isAlive).toBe(true);

    enemy.takeDamage(20);
    expect(enemy.health).toBe(0);
    expect(enemy.isAlive).toBe(false);
  });
});
