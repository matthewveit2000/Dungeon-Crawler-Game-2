import { Rng } from '../engine/Rng';
import { Level } from './Level';
import { TileType } from './MapGenerator';
import { Enemy, EnemyType } from './Enemy';
import enemiesPack from '../packs/Enemies.json';

export class EnemySpawner {
  private readonly rng: Rng;

  constructor(rng: Rng) {
    this.rng = rng;
  }

  /**
   * Spawns enemies on valid floor tiles across the given level.
   */
  public spawn(level: Level, playerSpawn: { x: number; y: number }): Enemy[] {
    const candidates: Array<{ x: number; y: number }> = [];
    const minDistanceTiles = enemiesPack.spawning.minDistanceFromPlayerTiles;
    const playerTileX = Math.floor(playerSpawn.x / level.tileSize);
    const playerTileY = Math.floor(playerSpawn.y / level.tileSize);

    for (let y = 0; y < level.grid.height; y++) {
      for (let x = 0; x < level.grid.width; x++) {
        if (level.grid.get(x, y) === TileType.FLOOR) {
          const dist = Math.hypot(x - playerTileX, y - playerTileY);
          if (dist >= minDistanceTiles) {
            candidates.push({ x, y });
          }
        }
      }
    }

    if (candidates.length === 0) {
      return [];
    }

    // Seeded Fisher-Yates shuffle on candidates to pick positions without collision
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = this.rng.nextInt(i + 1);
      const temp = candidates[i];
      candidates[i] = candidates[j];
      candidates[j] = temp;
    }

    const minCount = enemiesPack.spawning.minEnemies;
    const maxCount = enemiesPack.spawning.maxEnemies;
    const desiredCount = minCount + this.rng.nextInt(maxCount - minCount + 1);
    const count = Math.min(desiredCount, candidates.length);

    // Build weighted roulette
    const weights = enemiesPack.spawning.weights as Record<EnemyType, number>;
    const types = Object.keys(weights) as EnemyType[];
    const totalWeight = types.reduce((sum, t) => sum + weights[t], 0);

    const enemies: Enemy[] = [];
    for (let i = 0; i < count; i++) {
      const tile = candidates[i];
      const selectedType = this.pickWeightedType(types, weights, totalWeight);

      // Center the enemy within the tile
      const center = level.tileCenter(tile.x, tile.y);
      const enemyX = center.x;
      const enemyY = center.y;

      enemies.push(
        new Enemy(`enemy-${i}-${tile.x}_${tile.y}`, selectedType, enemyX, enemyY, {
          level,
          tileSize: level.tileSize,
        }),
      );
    }

    return enemies;
  }

  private pickWeightedType(
    types: EnemyType[],
    weights: Record<EnemyType, number>,
    totalWeight: number,
  ): EnemyType {
    let roll = this.rng.nextInt(totalWeight);
    for (const type of types) {
      roll -= weights[type];
      if (roll < 0) {
        return type;
      }
    }
    return types[0];
  }
}
