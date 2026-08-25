import { describe, it, expect, vi } from 'vitest';
import { Container } from 'pixi.js';
import { EntityManager } from './EntityManager';
import { Entity } from './Entity';

class TestEntity extends Entity {
  constructor(id: string, x = 0, y = 0) {
    super(id, x, y, { width: 10, height: 10, color: 0xff0000 });
  }
  public update(_dt: number): void {}
}

const setup = () => {
  const stage = new Container();
  return { stage, manager: new EntityManager(stage) };
};

describe('EntityManager', () => {
  it('adds an entity to the manager and the stage', () => {
    const { stage, manager } = setup();
    const entity = new TestEntity('a');

    manager.addEntity(entity);

    expect(manager.getEntities()).toEqual([entity]);
    expect(stage.children).toEqual([entity.sprite]);
  });

  it('finds an entity by id', () => {
    const { manager } = setup();
    const entity = new TestEntity('a');
    manager.addEntity(entity);

    expect(manager.getEntity('a')).toBe(entity);
    expect(manager.getEntity('missing')).toBeUndefined();
  });

  it('removes an entity and destroys its view', () => {
    const { stage, manager } = setup();
    const entity = new TestEntity('a');
    manager.addEntity(entity);

    expect(manager.removeEntity('a')).toBe(true);
    expect(manager.getEntities()).toHaveLength(0);
    expect(stage.children).toHaveLength(0);
    // Leaving the view alive was how descending a floor leaked memory.
    expect(entity.isDestroyed).toBe(true);
  });

  it('reports when there was nothing to remove', () => {
    const { manager } = setup();
    expect(manager.removeEntity('missing')).toBe(false);
  });

  it('clears and destroys every entity', () => {
    const { stage, manager } = setup();
    const entities = ['a', 'b', 'c'].map((id) => new TestEntity(id));
    entities.forEach((e) => manager.addEntity(e));

    manager.clear();

    expect(manager.getEntities()).toHaveLength(0);
    expect(stage.children).toHaveLength(0);
    expect(entities.every((e) => e.isDestroyed)).toBe(true);
  });

  it('updates every active entity with the step', () => {
    const { manager } = setup();
    const a = new TestEntity('a');
    const b = new TestEntity('b');
    const spyA = vi.spyOn(a, 'update');
    const spyB = vi.spyOn(b, 'update');

    manager.addEntity(a);
    manager.addEntity(b);
    manager.update(1 / 60);

    expect(spyA).toHaveBeenCalledWith(1 / 60);
    expect(spyB).toHaveBeenCalledWith(1 / 60);
  });

  it('survives an entity removing another entity mid-update', () => {
    const { manager } = setup();
    const victim = new TestEntity('victim');
    const remover = new TestEntity('remover');
    vi.spyOn(remover, 'update').mockImplementation(() => {
      manager.removeEntity('victim');
    });

    manager.addEntity(remover);
    manager.addEntity(victim);

    expect(() => manager.update(1 / 60)).not.toThrow();
    expect(manager.getEntity('victim')).toBeUndefined();
  });
});
