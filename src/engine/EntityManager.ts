import { Container } from 'pixi.js';
import { Entity } from './Entity';

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

  public removeEntity(entityId: string): void {
    const index = this.entities.findIndex(e => e.id === entityId);
    if (index !== -1) {
      const entity = this.entities[index];
      this.stage.removeChild(entity.sprite);
      this.entities.splice(index, 1);
    }
  }

  public getEntities(): Entity[] {
    return this.entities;
  }

  public update(dt: number): void {
    for (const entity of this.entities) {
      entity.update(dt);
    }
  }
}
