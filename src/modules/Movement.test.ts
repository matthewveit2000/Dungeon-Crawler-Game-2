import { describe, it, expect } from 'vitest';
import { resolveMovement } from './Movement';
import { Level } from './Level';
import { TileType } from './MapGenerator';

/** A 10x10-tile level of solid rock, with only the named tiles carved open. */
function levelWith(floors: [number, number][]): Level {
  const level = new Level({ width: 10, height: 10, steps: 0, brushRadius: 0, seed: 1 });
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) level.grid.set(x, y, TileType.WALL);
  }
  for (const [x, y] of floors) level.grid.set(x, y, TileType.FLOOR);
  return level;
}

const solidTest = (level: Level) => (x: number, y: number, w: number, h: number) =>
  level.isCollidingWithWall(x, y, w, h);

// Fixtures are expressed in tiles, never raw pixels, so changing the project's
// tile size cannot silently invalidate what these tests are checking.
const centre = (level: Level, tx: number, ty: number) => level.tileCenter(tx, ty);

/** A body sitting flush against the far corner of tile (tx, ty). */
const flushCorner = (level: Level, tx: number, ty: number, size: number) => ({
  x: (tx + 1) * level.tileSize - size / 2,
  y: (ty + 1) * level.tileSize - size / 2,
});

/** A quarter-tile body — the same proportion the player uses. */
const bodySize = (level: Level) => level.tileSize / 4;

/** Never advance more than half a tile between collision tests. */
const maxStepFor = (level: Level) => level.tileSize / 2;

describe('resolveMovement', () => {
  it('does not cut diagonally through an inside corner', () => {
    // Open in an L; (2,2) is the inside corner and stays solid.
    const level = levelWith([
      [1, 1],
      [2, 1],
      [1, 2],
    ]);
    const size = bodySize(level);
    const start = flushCorner(level, 1, 1, size);

    expect(level.isCollidingWithWall(start.x, start.y, size, size)).toBe(false);

    const end = resolveMovement(solidTest(level), {
      from: start,
      delta: { x: size, y: size },
      width: size,
      height: size,
      maxStep: maxStepFor(level),
    });

    // The body may slide, but it must never end up inside the corner tile.
    expect(level.isCollidingWithWall(end.x, end.y, size, size)).toBe(false);
  });

  it('leaves a body free to move after a diagonal push into a corner', () => {
    // The wedging bug: once inside a wall, every direction out was also blocked.
    const level = levelWith([
      [1, 1],
      [2, 1],
      [1, 2],
    ]);
    const size = bodySize(level);
    const solid = solidTest(level);
    const step = maxStepFor(level);

    const wedged = resolveMovement(solid, {
      from: flushCorner(level, 1, 1, size),
      delta: { x: size, y: size },
      width: size,
      height: size,
      maxStep: step,
    });

    const nudge = size / 2;
    const directions = [
      { x: -nudge, y: 0 },
      { x: nudge, y: 0 },
      { x: 0, y: -nudge },
      { x: 0, y: nudge },
    ];
    const escapes = directions.filter((delta) => {
      const next = resolveMovement(solid, {
        from: wedged,
        delta,
        width: size,
        height: size,
        maxStep: step,
      });
      return Math.hypot(next.x - wedged.x, next.y - wedged.y) > 0.001;
    });

    expect(escapes.length).toBeGreaterThan(0);
  });

  it('does not tunnel through a wall when a single step is very large', () => {
    // Floor either side of a solid column at tile x = 2.
    const level = levelWith([
      [1, 1],
      [3, 1],
    ]);
    const size = bodySize(level);
    const ts = level.tileSize;

    const end = resolveMovement(solidTest(level), {
      from: centre(level, 1, 1),
      delta: { x: ts * 2, y: 0 }, // Two whole tiles in one step.
      width: size,
      height: size,
      maxStep: maxStepFor(level),
    });

    expect(end.x).toBeLessThan(ts * 2);
    expect(level.isCollidingWithWall(end.x, end.y, size, size)).toBe(false);
    // ...and settles flush against the wall, not a whole substep short of it.
    expect(end.x).toBeGreaterThan(ts * 2 - size / 2 - 0.5);
  });

  it('produces the same result for one large step as for many small ones', () => {
    const level = levelWith([
      [1, 1],
      [2, 1],
      [3, 1],
    ]);
    const size = bodySize(level);
    const ts = level.tileSize;
    const solid = solidTest(level);
    const total = ts * 2.5;

    const oneBigStep = resolveMovement(solid, {
      from: centre(level, 1, 1),
      delta: { x: total, y: 0 },
      width: size,
      height: size,
      maxStep: maxStepFor(level),
    });

    let incremental = centre(level, 1, 1);
    for (let i = 0; i < 20; i++) {
      incremental = resolveMovement(solid, {
        from: incremental,
        delta: { x: total / 20, y: 0 },
        width: size,
        height: size,
        maxStep: maxStepFor(level),
      });
    }

    // Within the sub-pixel tolerance of the wall-settling bisection.
    expect(Math.abs(oneBigStep.x - incremental.x)).toBeLessThan(0.5);
  });

  it('slides along a wall instead of stopping dead', () => {
    // A vertical corridor: moving down-right should still move down.
    const level = levelWith([
      [1, 1],
      [1, 2],
      [1, 3],
    ]);
    const size = bodySize(level);
    const start = centre(level, 1, 1);

    const end = resolveMovement(solidTest(level), {
      from: start,
      delta: { x: size, y: size },
      width: size,
      height: size,
      maxStep: maxStepFor(level),
    });

    expect(end.y).toBeGreaterThan(start.y);
    expect(level.isCollidingWithWall(end.x, end.y, size, size)).toBe(false);
  });

  it('lets a body embedded in a wall move back out', () => {
    const level = levelWith([[1, 1]]);
    const size = bodySize(level);
    const inWall = centre(level, 5, 5); // Solid rock.

    expect(level.isCollidingWithWall(inWall.x, inWall.y, size, size)).toBe(true);

    const end = resolveMovement(solidTest(level), {
      from: inWall,
      delta: { x: -size, y: 0 },
      width: size,
      height: size,
      maxStep: maxStepFor(level),
    });

    expect(end.x).toBeLessThan(inWall.x);
  });

  it('stays put when a body exactly fills its tile', () => {
    const level = levelWith([[1, 1]]);
    const size = level.tileSize; // No slack in any direction.
    const start = centre(level, 1, 1);

    const end = resolveMovement(solidTest(level), {
      from: start,
      delta: { x: size / 2, y: size / 2 },
      width: size,
      height: size,
      maxStep: maxStepFor(level),
    });

    expect(end).toEqual(start);
  });

  it('settles flush against a wall rather than a substep short of it', () => {
    const level = levelWith([[1, 1]]);
    const size = bodySize(level);
    const ts = level.tileSize;

    const end = resolveMovement(solidTest(level), {
      from: centre(level, 1, 1),
      delta: { x: ts * 2, y: 0 },
      width: size,
      height: size,
      maxStep: maxStepFor(level),
    });

    // The body advances until its edge meets the far side of tile (1, 1).
    const limit = ts * 2 - size / 2;
    expect(end.x).toBeGreaterThan(limit - 0.5);
    expect(end.x).toBeLessThanOrEqual(limit);
  });
});
