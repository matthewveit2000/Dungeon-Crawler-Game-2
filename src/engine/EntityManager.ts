import { Container } from 'pixi.js';
import { Entity } from './Entity';

/**
 * EntityManager — tracks every active entity and drives their updates.
 *
 * Tier 1. Owns entity lifetime: anything removed from the manager is also
 * detached from the stage and destroyed, so descending a floor genuinely
 * releases the previous floor's memory instead of merely hiding it.
 */
export class EntityManager {
  private entities: Entity[] = [];
  private stage: Container;

  constructor(stage: Container) {
    this.stage = stage;
  }

  public addEntity(entity: Entity): void {
    this.entities.push(entity);
    this.stage.addChild(entity.sprite);
  }

  /** Removes and destroys one entity. Returns true if it was found. */
  public removeEntity(entityId: string): boolean {
    const index = this.entities.findIndex((e) => e.id === entityId);
    if (index === -1) return false;

    const [entity] = this.entities.splice(index, 1);
    this.stage.removeChild(entity.sprite);
    entity.destroy();
    return true;
  }

  /** Removes and destroys every entity — used when wiping a floor. */
  public clear(): void {
    for (const entity of this.entities) {
      this.stage.removeChild(entity.sprite);
      entity.destroy();
    }
    this.entities = [];
  }

  public getEntities(): readonly Entity[] {
    return this.entities;
  }

  public getEntity(entityId: string): Entity | undefined {
    return this.entities.find((e) => e.id === entityId);
  }

  public update(dt: number): void {
    // Iterate a snapshot so an entity that spawns or removes another mid-update
    // cannot corrupt the traversal.
    for (const entity of [...this.entities]) {
      if (!entity.isDestroyed) entity.update(dt);
    }
  }
}
