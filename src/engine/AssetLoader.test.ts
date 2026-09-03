import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AssetLoader } from './AssetLoader';
import { Texture, TextureSource } from 'pixi.js';

describe('AssetLoader', () => {
  const tileSize = 32;

  beforeEach(() => {
    AssetLoader.clear();
    vi.restoreAllMocks();
  });

  it('rejects a sprite whose dimensions are not a whole multiple of the tile size at load', () => {
    // 30x30 is not a whole multiple of 32
    const invalidSource = new TextureSource({ width: 30, height: 30 });
    const invalidTexture = new Texture({ source: invalidSource });

    expect(() => {
      AssetLoader.register('invalid-sprite', invalidTexture, tileSize);
    }).toThrow(/whole multiple/i);
  });

  it('accepts a sprite whose dimensions are a whole multiple of the tile size', () => {
    const validSource = new TextureSource({ width: 32, height: 32 });
    const validTexture = new Texture({ source: validSource });

    expect(() => {
      AssetLoader.register('valid-sprite', validTexture, tileSize);
    }).not.toThrow();

    expect(AssetLoader.get('valid-sprite')).toBe(validTexture);
  });

  it('accepts a multi-tile sprite whose dimensions are multiples of the tile size', () => {
    const multiSource = new TextureSource({ width: 64, height: 96 });
    const multiTexture = new Texture({ source: multiSource });

    expect(() => {
      AssetLoader.register('boss-sprite', multiTexture, tileSize);
    }).not.toThrow();

    expect(AssetLoader.get('boss-sprite')).toBe(multiTexture);
  });

  it('reports undefined for unregistered sprites', () => {
    expect(AssetLoader.get('non-existent')).toBeUndefined();
  });
});
