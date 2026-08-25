import { describe, it, expect } from 'vitest';
import { resolveMovement } from './Movement';
import { Level } from './Level';
import { TileType } from './MapGenerator';

/** A 10x10-tile level of solid wall, with only the named tiles carved open. */
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

describe('resolveMovement', () => {
  it('does not cut diagonally through an inside corner', () => {
    // Open in an L; (2,2) is the corner and stays solid.
    const level = levelWith([
      [1, 1],
      [2, 1],
      [1, 2],
    ]);
    const size = 10;

    const start = { x: 75, y: 75 };
    expect(level.isCollidingWithWall(start.x, start.y, size, size)).toBe(false);

    const end = resolveMovement(solidTest(level), {
      from: start,
      delta: { x: 7.07, y: 7.07 },
      width: size,
      height: size,
      maxStep: 20,
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
    const size = 10;
    const solid = solidTest(level);

    const wedged = resolveMovement(solid, {
      from: { x: 75, y: 75 },
      delta: { x: 7.07, y: 7.07 },
      width: size,
      height: size,
      maxStep: 20,
    });

    const directions = [
      { x: -5, y: 0 },
      { x: 5, y: 0 },
      { x: 0, y: -5 },
      { x: 0, y: 5 },
    ];
    const escapes = directions.filter((delta) => {
      const next = resolveMovement(solid, {
        from: wedged,
        delta,
        width: size,
        height: size,
        maxStep: 20,
      });
      return Math.hypot(next.x - wedged.x, next.y - wedged.y) > 0.001;
    });

    expect(escapes.length).toBeGreaterThan(0);
  });

  it('does not tunnel through a wall when a single step is very large', () => {
    // Floor either side of a solid column at x = 2.
    const level = levelWith([
      [1, 1],
      [3, 1],
    ]);
    const size = 10;

    const end = resolveMovement(solidTest(level), {
      from: { x: 60, y: 60 },
      delta: { x: 80, y: 0 }, // Two whole tiles in one step.
      width: size,
      height: size,
      maxStep: 20,
    });

    expect(end.x).toBeLessThan(80);
    expect(level.isCollidingWithWall(end.x, end.y, size, size)).toBe(false);
    // ...and settles flush against the wall rather than a whole substep short.
    expect(end.x).toBeGreaterThan(74);
  });

  it('produces the same result for one large step as for many small ones', () => {
    const level = levelWith([
      [1, 1],
      [2, 1],
      [3, 1],
    ]);
    const size = 10;
    const solid = solidTest(level);

    const oneBigStep = resolveMovement(solid, {
      from: { x: 60, y: 60 },
      delta: { x: 100, y: 0 },
      width: size,
      height: size,
      maxStep: 20,
    });

    let incremental = { x: 60, y: 60 };
    for (let i = 0; i < 20; i++) {
      incremental = resolveMovement(solid, {
        from: incremental,
        delta: { x: 5, y: 0 },
        width: size,
        height: size,
        maxStep: 20,
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
    const size = 10;

    const end = resolveMovement(solidTest(level), {
      from: { x: 60, y: 60 },
      delta: { x: 7.07, y: 7.07 },
      width: size,
      height: size,
      maxStep: 20,
    });

    expect(end.y).toBeGreaterThan(60);
    expect(level.isCollidingWithWall(end.x, end.y, size, size)).toBe(false);
  });

  it('lets a body embedded in a wall move back out', () => {
    const level = levelWith([[1, 1]]);
    const size = 10;
    const inWall = { x: 220, y: 220 };
    expect(level.isCollidingWithWall(inWall.x, inWall.y, size, size)).toBe(true);

    const end = resolveMovement(solidTest(level), {
      from: inWall,
      delta: { x: -5, y: 0 },
      width: size,
      height: size,
      maxStep: 20,
    });

    expect(end.x).toBeLessThan(inWall.x);
  });

  it('stays put when a body exactly fills its tile', () => {
    const level = levelWith([[1, 1]]);
    const size = 40; // Exactly one tile: no slack in any direction.
    const end = resolveMovement(solidTest(level), {
      from: { x: 60, y: 60 },
      delta: { x: 20, y: 20 },
      width: size,
      height: size,
      maxStep: 20,
    });
    expect(end).toEqual({ x: 60, y: 60 });
  });

  it('settles flush against a wall rather than a substep short of it', () => {
    const level = levelWith([[1, 1]]);
    const size = 10;
    const end = resolveMovement(solidTest(level), {
      from: { x: 50, y: 60 },
      delta: { x: 100, y: 0 },
      width: size,
      height: size,
      maxStep: 20,
    });
    // Tile (1,1) spans 40-80, so a 10px body can reach x = 75.
    expect(end.x).toBeGreaterThan(74.5);
    expect(end.x).toBeLessThanOrEqual(75);
  });
});
