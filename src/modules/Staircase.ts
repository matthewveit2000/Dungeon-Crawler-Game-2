import { Entity } from '../engine/Entity';
import { parseColor } from '../engine/View';
import interactables from '../packs/Interactables.json';

/**
 * Staircase — the exit from a floor.
 *
 * Tier 2. Its dimensions and colour come from the Tier 3 interactables pack; it
 * has no behaviour of its own, because the interaction check lives with the
 * player that performs it.
 */
export class Staircase extends Entity {
  constructor(id: string, x: number, y: number) {
    const config = interactables.staircase;
    super(id, x, y, {
      width: config.width,
      height: config.height,
      color: parseColor(config.color),
      sprite: config.sprite,
    });
  }

  public update(_dt: number): void {
    // Static: the staircase never moves or animates.
  }
}
