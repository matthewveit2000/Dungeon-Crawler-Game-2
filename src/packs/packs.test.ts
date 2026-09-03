import { describe, it, expect } from 'vitest';
import world from './World.json';
import player from './Player.json';
import interactables from './Interactables.json';
import controls from './Controls.json';
import debug from './Debug.json';

/**
 * Guards the contracts documented in .docs/ART_GUIDE.md and
 * .docs/SYSTEMS_OVERVIEW.md. These are cheap assertions over data, but they are
 * the reason the documentation cannot quietly drift away from the build.
 */
describe('Tier 3 packs', () => {
  describe('art resolution', () => {
    it('declares a sprite resolution of 32x32', () => {
      expect(world.spriteResolution).toBe(32);
    });

    it('keeps one world tile equal to one sprite, so art drops in at 1:1', () => {
      // If these ever diverge, every sprite would need scaling by a fraction
      // to fit a tile, which is exactly what destroys crisp pixel art.
      expect(world.tileSize).toBe(world.spriteResolution);
    });

    it('sizes a full-tile interactable to exactly one sprite', () => {
      expect(interactables.staircase.width).toBe(world.spriteResolution);
      expect(interactables.staircase.height).toBe(world.spriteResolution);
    });

    it('keeps the player collision box smaller than its sprite', () => {
      // The sprite is a whole tile; the box represents the character's feet.
      // A box the full width of the art could not fit where the art suggests.
      expect(player.sizeRatio).toBeGreaterThan(0);
      expect(player.sizeRatio).toBeLessThan(1);
    });

    it('keeps the collision box a whole number of pixels', () => {
      expect(Number.isInteger(world.tileSize * player.sizeRatio)).toBe(true);
    });

    it('declares a whole-number default zoom', () => {
      // A fractional zoom means one art pixel covers a fraction of a screen
      // pixel, which cannot be drawn evenly and produces seams and shimmer.
      expect(Number.isInteger(world.defaultZoom)).toBe(true);
      expect(world.defaultZoom).toBeGreaterThanOrEqual(1);
    });
  });

  describe('world', () => {
    it('carves corridors comfortably wider than the player', () => {
      // What matters is the corridor's width relative to the body moving down
      // it, not its width in tiles. A single-tile corridor is four times the
      // player's collision box, which is ample — and because both sides scale
      // with tileSize, that ratio survives any change of resolution. At the
      // project's early 40px tiles the same brush was tight enough to need
      // widening, which is why this asserts the ratio and not a pixel count.
      const corridorTiles = world.generation.brushRadius * 2 + 1;
      const corridorPx = corridorTiles * world.tileSize;
      const playerPx = world.tileSize * player.sizeRatio;
      expect(corridorPx / playerPx).toBeGreaterThanOrEqual(3);
    });

    it('defines a colour for every tile type', () => {
      expect(world.palette.wall).toMatch(/^0x[0-9a-f]{6}$/i);
      expect(world.palette.floor).toMatch(/^0x[0-9a-f]{6}$/i);
    });
  });

  describe('controls', () => {
    it('binds every movement direction and the interact key', () => {
      for (const action of [
        controls.moveUp,
        controls.moveDown,
        controls.moveLeft,
        controls.moveRight,
        controls.interact,
      ]) {
        expect(action.length).toBeGreaterThan(0);
      }
    });

    it('uses lowercase keys, which is what the input layer reports', () => {
      const every = [
        ...controls.moveUp,
        ...controls.moveDown,
        ...controls.moveLeft,
        ...controls.moveRight,
        ...controls.interact,
      ];
      for (const key of every) expect(key).toBe(key.toLowerCase());
    });
  });

  describe('debug', () => {
    it('describes the test marker', () => {
      expect(debug.testSquare.width).toBeGreaterThan(0);
      expect(debug.testSquare.spinRate).toBeGreaterThan(0);
    });
  });
});
