import { Enemy, EnemyOptions } from './Enemy';
import worldPack from '../packs/World.json';

/**
 * Boss — monumental guardian residing in the Boss Arena.
 *
 * Tier 2. Holds high hit points, formidable damage, and begins in a NEUTRAL state
 * until player crosses the arena threshold.
 */
export class Boss extends Enemy {
  constructor(id: string, x: number, y: number, options: EnemyOptions = {}) {
    super(id, 'goblin', x, y, options);

    const tileSize = options.tileSize ?? options.level?.tileSize ?? worldPack.tileSize;
    this.width = Math.round(tileSize * 1.5);
    this.height = Math.round(tileSize * 1.5);
    this.maxHealth = 400;
    this.health = 400;
    this.damage = 25;
    this.state = 'NEUTRAL';
  }

  public activateAggro(): void {
    this.state = 'AGGRO';
  }

  public override update(dt: number): void {
    if (this.state === 'NEUTRAL') {
      this.syncView();
      return;
    }

    super.update(dt);
  }
}
