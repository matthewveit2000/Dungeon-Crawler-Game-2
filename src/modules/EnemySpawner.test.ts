import { describe, it, expect } from 'vitest';
import { EnemySpawner } from './EnemySpawner';
import { Level } from './Level';
import { Rng } from '../engine/Rng';
import enemiesPack from '../packs/Enemies.json';
import { TileType } from './MapGenerator';

describe('EnemySpawner', () => {
  it('spawns a number of enemies bounded by Tier 3 density rules', () => {
    const level = new Level({ width: 30, height: 30, steps: 50, seed: 12345 });
    const rng = new Rng(12345);
    const spawner = new EnemySpawner(rng);

    const enemies = spawner.spawn(level, level.spawnPoint);
    expect(enemies.length).toBeGreaterThanOrEqual(enemiesPack.spawning.minEnemies);
    expect(enemies.length).toBeLessThanOrEqual(enemiesPack.spawning.maxEnemies);
  });

  it('spawns enemies exclusively on floor tiles', () => {
    const level = new Level({ width: 30, height: 30, steps: 50, seed: 12345 });
    const rng = new Rng(12345);
    const spawner = new EnemySpawner(rng);

    const enemies = spawner.spawn(level, level.spawnPoint);
    for (const enemy of enemies) {
      const tileX = Math.floor(enemy.x / level.tileSize);
      const tileY = Math.floor(enemy.y / level.tileSize);
      expect(level.grid.get(tileX, tileY)).toBe(TileType.FLOOR);
    }
  });

  it('keeps enemies away from the player spawn point according to minDistanceFromPlayerTiles', () => {
    const level = new Level({ width: 30, height: 30, steps: 50, seed: 12345 });
    const rng = new Rng(12345);
    const spawner = new EnemySpawner(rng);

    const spawnPoint = level.spawnPoint;
    const enemies = spawner.spawn(level, spawnPoint);

    const minDistancePx = enemiesPack.spawning.minDistanceFromPlayerTiles * level.tileSize;
    for (const enemy of enemies) {
      const dist = Math.hypot(enemy.x - spawnPoint.x, enemy.y - spawnPoint.y);
      expect(dist).toBeGreaterThanOrEqual(minDistancePx);
    }
  });

  it('produces identical enemy spawns with the same seed (determinism)', () => {
    const level1 = new Level({ width: 30, height: 30, steps: 50, seed: 999 });
    const spawner1 = new EnemySpawner(new Rng(999));
    const list1 = spawner1.spawn(level1, level1.spawnPoint);

    const level2 = new Level({ width: 30, height: 30, steps: 50, seed: 999 });
    const spawner2 = new EnemySpawner(new Rng(999));
    const list2 = spawner2.spawn(level2, level2.spawnPoint);

    expect(list1.length).toBe(list2.length);
    for (let i = 0; i < list1.length; i++) {
      expect(list1[i].enemyType).toBe(list2[i].enemyType);
      expect(list1[i].x).toBe(list2[i].x);
      expect(list1[i].y).toBe(list2[i].y);
      expect(list1[i].health).toBe(list2[i].health);
    }
  });
});
