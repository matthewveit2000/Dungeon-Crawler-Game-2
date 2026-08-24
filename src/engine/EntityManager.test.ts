import { describe, it, expect, vi } from 'vitest';
import { EntityManager } from './EntityManager';
import { Entity } from './Entity';
import { Container } from 'pixi.js';

class MockEntity extends Entity {
  constructor(id: string) {
    super(id);
  }
  update(_dt: number): void {}
}

describe('EntityManager', () => {
  it('should add an entity to the manager and stage', () => {
    const stage = new Container();
    const manager = new EntityManager(stage);
    const entity = new MockEntity('test-1');

    manager.addEntity(entity);

    expect(manager.getEntities().length).toBe(1);
    expect(manager.getEntities()[0]).toBe(entity);
    expect(stage.children.length).toBe(1);
    expect(stage.children[0]).toBe(entity.sprite);
  });

  it('should remove an entity from the manager and stage', () => {
    const stage = new Container();
    const manager = new EntityManager(stage);
    const entity = new MockEntity('test-2');

    manager.addEntity(entity);
    expect(manager.getEntities().length).toBe(1);

    manager.removeEntity('test-2');

    expect(manager.getEntities().length).toBe(0);
    expect(stage.children.length).toBe(0);
  });

  it('should call update on all active entities', () => {
    const stage = new Container();
    const manager = new EntityManager(stage);
    const entity1 = new MockEntity('test-3');
    const entity2 = new MockEntity('test-4');

    const updateSpy1 = vi.spyOn(entity1, 'update');
    const updateSpy2 = vi.spyOn(entity2, 'update');

    manager.addEntity(entity1);
    manager.addEntity(entity2);

    manager.update(16.66);

    expect(updateSpy1).toHaveBeenCalledWith(16.66);
    expect(updateSpy2).toHaveBeenCalledWith(16.66);
  });
});
