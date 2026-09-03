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

  it('resolves its art from a declaration when sprite is loaded in AssetLoader', async () => {
    const { AssetLoader } = await import('./AssetLoader');
    const { Texture, TextureSource, Sprite } = await import('pixi.js');
    const source = new TextureSource({ width: 32, height: 32 });
    const texture = new Texture({ source });
    AssetLoader.register('player-art', texture, 32);

    const entity = new TestEntity('p1', 10, 20, {
      width: 32,
      height: 32,
      color: 0x00ff00,
      sprite: 'player-art',
    });

    expect(entity.sprite.children.some((c) => c instanceof Sprite)).toBe(true);
  });

  it('yields a placeholder and a console warning, not an exception, when art is missing', async () => {
    const { vi } = await import('vitest');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    let entity!: TestEntity;
    expect(() => {
      entity = new TestEntity('p2', 10, 20, {
        width: 32,
        height: 32,
        color: 0x00ff00,
        sprite: 'missing-art-key',
      });
    }).not.toThrow();

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('missing-art-key'));
    // Yields placeholder graphics view
    expect(entity.sprite).toBeDefined();
    expect(entity.width).toBe(32);
    warnSpy.mockRestore();
  });

  it('swaps sprite texture when animation advances', async () => {
    const { AssetLoader } = await import('./AssetLoader');
    const { Texture, TextureSource, Sprite } = await import('pixi.js');
    const t0 = new Texture({ source: new TextureSource({ width: 32, height: 32 }) });
    const t1 = new Texture({ source: new TextureSource({ width: 32, height: 32 }) });
    AssetLoader.register('anim_0', t0, 32);
    AssetLoader.register('anim_1', t1, 32);

    class AnimEntity extends TestEntity {
      public override update(dt: number): void {
        this.updateAnimation(dt);
      }
    }

    const entity = new AnimEntity('a1', 0, 0, {
      width: 32,
      height: 32,
      color: 0x00ff00,
      animations: {
        run: { fps: 10, frames: ['anim_0', 'anim_1'] },
      },
      defaultAnimation: 'run',
    });

    const spriteChild = entity.sprite.children.find((c) => c instanceof Sprite) as InstanceType<
      typeof Sprite
    >;
    expect(spriteChild.texture).toBe(t0);

    // Advance 0.1s (1 frame at 10 fps)
    entity.update(0.1);
    expect(spriteChild.texture).toBe(t1);
  });
});
