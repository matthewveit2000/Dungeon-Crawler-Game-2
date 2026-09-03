import { describe, it, expect } from 'vitest';
import { TileRenderer, ReadableGrid } from './TileRenderer';
import { MapOverlay } from './MapOverlay';

/** A grid built from rows of digits, e.g. ['011', '110']. */
const gridFrom = (rows: string[]): ReadableGrid => ({
  width: rows[0].length,
  height: rows.length,
  get: (x, y) => Number(rows[y][x]),
});

describe('TileRenderer', () => {
  it('exposes a view that can be added to a stage', () => {
    const renderer = new TileRenderer({ tileSize: 8, palette: [0x000000, 0xffffff] });
    expect(renderer.view).toBeDefined();
  });

  it('renders without throwing and can be re-rendered', () => {
    const renderer = new TileRenderer({ tileSize: 8, palette: [0x000000, 0xffffff] });
    const grid = gridFrom(['011', '110', '001']);
    expect(() => renderer.render(grid)).not.toThrow();
    expect(() => renderer.render(grid)).not.toThrow();
  });

  it('handles a grid whose tiles are all skipped', () => {
    const renderer = new TileRenderer({
      tileSize: 8,
      palette: [0x000000, 0xffffff],
      skip: [0, 1],
    });
    expect(() => renderer.render(gridFrom(['01', '10']))).not.toThrow();
  });

  it('releases its view on destroy', () => {
    const renderer = new TileRenderer({ tileSize: 8, palette: [0x000000, 0xffffff] });
    renderer.render(gridFrom(['01']));
    renderer.destroy();
    expect(renderer.view.destroyed).toBe(true);
  });

  it('renders tiles with registered textures from AssetLoader', async () => {
    const { AssetLoader } = await import('./AssetLoader');
    const { Texture, TextureSource } = await import('pixi.js');
    const source = new TextureSource({ width: 32, height: 32 });
    const texture = new Texture({ source });
    AssetLoader.register('floor-tile', texture, 32);

    const renderer = new TileRenderer({
      tileSize: 32,
      palette: [0x000000, 0xffffff],
      sprites: [undefined, 'floor-tile'],
    });

    expect(() => renderer.render(gridFrom(['01', '10']))).not.toThrow();
  });

  it('falls back to palette colour and logs warning when a tile sprite is missing', async () => {
    const { vi } = await import('vitest');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const renderer = new TileRenderer({
      tileSize: 32,
      palette: [0x000000, 0xffffff],
      sprites: [undefined, 'missing-tile-sprite'],
    });

    expect(() => renderer.render(gridFrom(['01']))).not.toThrow();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('missing-tile-sprite'));

    warnSpy.mockRestore();
  });
});

describe('MapOverlay', () => {
  const grid = gridFrom(['011', '110', '001']);

  it('starts hidden', () => {
    const overlay = new MapOverlay({ tileSize: 4, palette: [0x000000, 0xffffff] });
    expect(overlay.isVisible).toBe(false);
    expect(overlay.view.visible).toBe(false);
  });

  it('shows and centres itself in the viewport', () => {
    const overlay = new MapOverlay({ tileSize: 4, palette: [0x000000, 0xffffff] });
    overlay.show(grid, 800, 600);

    expect(overlay.isVisible).toBe(true);
    expect(overlay.view.x).toBe((800 - 3 * 4) / 2);
    expect(overlay.view.y).toBe((600 - 3 * 4) / 2);
  });

  it('lives in screen space, so a moving camera cannot carry it off screen', () => {
    // Positioning inside the camera-pivoted world was why the macro map vanished.
    const overlay = new MapOverlay({ tileSize: 4, palette: [0x000000, 0xffffff] });
    overlay.show(grid, 800, 600);
    expect(Math.abs(overlay.view.x)).toBeLessThan(800);
    expect(Math.abs(overlay.view.y)).toBeLessThan(600);
  });

  it('toggles between shown and hidden', () => {
    const overlay = new MapOverlay({ tileSize: 4, palette: [0x000000, 0xffffff] });
    expect(overlay.toggle(grid, 800, 600)).toBe(true);
    expect(overlay.isVisible).toBe(true);
    expect(overlay.toggle(grid, 800, 600)).toBe(false);
    expect(overlay.isVisible).toBe(false);
  });

  it('holds one drawing at a time however often it is shown', () => {
    // Each call used to add another copy that was never released.
    const overlay = new MapOverlay({ tileSize: 4, palette: [0x000000, 0xffffff] });
    for (let i = 0; i < 10; i++) overlay.show(grid, 800, 600);
    expect(overlay.view.children).toHaveLength(1);

    overlay.hide();
    expect(overlay.view.children).toHaveLength(0);
  });

  it('draws a backdrop panel when one is configured', () => {
    const overlay = new MapOverlay({
      tileSize: 4,
      palette: [0x000000, 0xffffff],
      backdrop: 0x111111,
      backdropAlpha: 0.9,
      padding: 8,
    });
    overlay.show(grid, 800, 600);
    expect(overlay.view.children).toHaveLength(2);

    for (let i = 0; i < 5; i++) overlay.show(grid, 800, 600);
    expect(overlay.view.children).toHaveLength(2);

    overlay.hide();
    expect(overlay.view.children).toHaveLength(0);
  });
});
