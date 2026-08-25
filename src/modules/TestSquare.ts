import { Entity } from '../engine/Entity';
import { parseColor } from '../engine/View';
import debug from '../packs/Debug.json';

/**
 * TestSquare — a spinning marker used to prove the entity pipeline works.
 *
 * Tier 2. Kept as a diagnostic for the audit toolkit; its appearance and spin
 * rate come from the Tier 3 debug pack.
 */
export class TestSquare extends Entity {
  private readonly spinRate: number;

  constructor(id: string, x: number, y: number) {
    const config = debug.testSquare;
    super(id, x, y, {
      width: config.width,
      height: config.height,
      color: parseColor(config.color),
    });
    this.spinRate = config.spinRate;
  }

  public update(dt: number): void {
    // Scaled by delta time so the spin runs at the same rate on any machine.
    this.sprite.rotation += this.spinRate * dt;
  }
}
