import { describe, it, expect, vi } from 'vitest';
import { Camera } from './Camera';
import { Container, Texture, TextureSource } from 'pixi.js';
import { AssetLoader } from './AssetLoader';
import { FloorManager } from '../modules/FloorManager';
import { EntityManager } from './EntityManager';
import { InputManager } from './InputManager';
import { Level } from '../modules/Level';
import { TileRenderer } from './TileRenderer';
import { MapGrid } from '../modules/MapGrid';
import { TileType } from '../modules/MapGenerator';
import { resetWarnedMissingSprites } from './View';
import { Staircase } from '../modules/Staircase';
import { Player } from '../modules/Player';
import { Entity } from './Entity';

describe('Phase 19: Art Pipeline Checkpoint', () => {
  describe('Integer Scaling & Whole-Pixel Snapping', () => {
    it('enforces strict integer scaling on stage at all zoom levels', () => {
      const stage = new Container();
      const camera = new Camera(stage, 1280, 720, 2);

      for (const zoom of [1, 2, 3, 4, 5]) {
        camera.setZoom(zoom);
        expect(Number.isInteger(stage.scale.x)).toBe(true);
        expect(Number.isInteger(stage.scale.y)).toBe(true);
        expect(stage.scale.x).toBe(zoom);
        expect(stage.scale.y).toBe(zoom);
      }
    });

    it('rejects fractional zoom values to prevent pixel distortion and seams', () => {
      const stage = new Container();
      const camera = new Camera(stage, 1280, 720, 2);

      expect(() => camera.setZoom(1.5)).toThrow(/integer/i);
      expect(() => camera.setZoom(0.75)).toThrow(/integer/i);
      expect(() => camera.setZoom(0)).toThrow(/integer/i);
      expect(() => camera.setZoom(-1)).toThrow(/integer/i);
    });

    it('guarantees camera pivot snaps to whole pixels after targeting moving entities', () => {
      const stage = new Container();
      const camera = new Camera(stage, 1280, 720, 2);
      class TargetEntity extends Entity {
        public override update(): void {}
      }
      const target = new TargetEntity('t', 105.743, 200.128);
      camera.setTarget(target);

      camera.update();

      expect(Number.isInteger(stage.pivot.x)).toBe(true);
      expect(Number.isInteger(stage.pivot.y)).toBe(true);
      expect(stage.pivot.x).toBe(106);
      expect(stage.pivot.y).toBe(200);
    });
  });

  describe('Texture Memory Stability Across Floor Descents', () => {
    it('maintains constant texture count across repeated floor descents', () => {
      const world = new Container();
      const entityManager = new EntityManager(world);
      const inputManager = new InputManager();
      const level = new Level({ width: 30, height: 30, steps: 50, seed: 42 });

      let renderCount = 0;
      const floorManager = new FloorManager(level, entityManager, inputManager, () => {
        renderCount++;
      });

      floorManager.build();

      // Descend 10 floors
      for (let i = 0; i < 10; i++) {
        floorManager.teleportToStaircase();
        floorManager.descend();
        floorManager.update();
      }

      expect(renderCount).toBe(11);
      // Ensure entity display objects stay strictly bounded without leaks
      expect(world.children.length).toBe(2 + floorManager.getEnemies().length);
      expect(world.children.length).toBeLessThanOrEqual(12);
    });

    it('clears and rebuilds tile graphics cleanly without accumulating memory', () => {
      const tileRenderer = new TileRenderer({
        tileSize: 32,
        palette: [0x000000, 0xffffff],
      });

      const grid = new MapGrid<number>(10, 10, TileType.WALL);
      grid.set(5, 5, TileType.FLOOR);

      // Re-rendering clears context instructions instead of leaking graphics objects
      for (let i = 0; i < 5; i++) {
        tileRenderer.render(grid);
      }

      expect(tileRenderer.view.children.length).toBe(1);
    });
  });

  describe('Placeholder Fallback for Every Entity Type', () => {
    it('gracefully falls back to placeholder when player sprite is missing', () => {
      resetWarnedMissingSprites();
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const input = new InputManager();
      const player = new Player('test_p', 0, 0, input);

      expect(player.sprite).toBeDefined();
      expect(player.width).toBeGreaterThan(0);
      expect(player.height).toBeGreaterThan(0);

      warnSpy.mockRestore();
    });

    it('gracefully falls back to placeholder when staircase sprite is missing', () => {
      resetWarnedMissingSprites();
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const staircase = new Staircase('test_s', 64, 64);

      expect(staircase.sprite).toBeDefined();
      expect(staircase.width).toBeGreaterThan(0);
      expect(staircase.height).toBeGreaterThan(0);

      warnSpy.mockRestore();
    });

    it('deduplicates missing sprite warnings across repeated frames and entities', () => {
      resetWarnedMissingSprites();
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      new Staircase('s1', 0, 0);
      new Staircase('s2', 32, 0);
      new Staircase('s3', 64, 0);

      const missingWarnings = warnSpy.mock.calls.filter(
        (call) => typeof call[0] === 'string' && call[0].includes('Missing sprite "staircase"'),
      );
      expect(missingWarnings.length).toBe(1);

      warnSpy.mockRestore();
    });
  });

  describe('Asset Dimension Rigor & Packaging', () => {
    it('rejects textures whose dimensions are not integer multiples of tileSize', () => {
      const nonSquareSource = new TextureSource({ width: 31, height: 32 });
      const nonSquareTex = new Texture({ source: nonSquareSource });

      expect(() => {
        AssetLoader.register('invalid_tex', nonSquareTex, 32);
      }).toThrow(/whole multiple/i);
    });

    it('accepts multi-tile entities whose dimensions are whole multiples of tileSize', () => {
      const bossSource = new TextureSource({ width: 64, height: 64 });
      const bossTex = new Texture({ source: bossSource });

      expect(() => {
        AssetLoader.register('boss_sprite', bossTex, 32);
      }).not.toThrow();
    });
  });
});
