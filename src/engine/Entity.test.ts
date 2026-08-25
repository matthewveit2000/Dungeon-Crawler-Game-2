import { describe, it, expect } from 'vitest';
import { Entity } from './Entity';

class TestEntity extends Entity {
  public update(_dt: number): void {}
}

describe('Entity', () => {
  it('places its view at its position on construction', () => {
    const entity = new TestEntity('a', 40, 90, { width: 10, height: 10, color: 0x00ff00 });
    expect(entity.sprite.x).toBe(40);
    expect(entity.sprite.y).toBe(90);
  });

  it('takes its collision box from the shape', () => {
    const entity = new TestEntity('a', 0, 0, { width: 12, height: 34, color: 0x00ff00 });
    expect(entity.width).toBe(12);
    expect(entity.height).toBe(34);
  });

  it('pivots the view on its centre so positions mean the centre', () => {
    const entity = new TestEntity('a', 0, 0, { width: 20, height: 20, color: 0x00ff00 });
    expect(entity.sprite.pivot.x).toBe(10);
    expect(entity.sprite.pivot.y).toBe(10);
  });

  it('syncs the view to the position on demand', () => {
    const entity = new TestEntity('a', 0, 0, { width: 10, height: 10, color: 0x00ff00 });
    entity.x = 500;
    entity.y = 250;
    entity.syncView();
    expect(entity.sprite.x).toBe(500);
    expect(entity.sprite.y).toBe(250);
  });

  it('destroys its view exactly once', () => {
    const entity = new TestEntity('a', 0, 0, { width: 10, height: 10, color: 0x00ff00 });
    expect(entity.isDestroyed).toBe(false);

    entity.destroy();
    expect(entity.isDestroyed).toBe(true);

    expect(() => entity.destroy()).not.toThrow();
  });

  it('ignores a view sync after being destroyed', () => {
    // An entity torn down partway through its own update still gets synced.
    const entity = new TestEntity('a', 0, 0, { width: 10, height: 10, color: 0x00ff00 });
    entity.destroy();
    entity.x = 100;
    expect(() => entity.syncView()).not.toThrow();
  });

  it('works without a shape', () => {
    const entity = new TestEntity('a', 5, 5);
    expect(entity.width).toBe(0);
    expect(entity.sprite.x).toBe(5);
  });
});
