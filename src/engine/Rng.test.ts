import { describe, it, expect } from 'vitest';
import { Rng } from './Rng';

describe('Rng', () => {
  it('produces the same sequence for the same seed', () => {
    const a = new Rng(12345);
    const b = new Rng(12345);
    const left = Array.from({ length: 50 }, () => a.next());
    const right = Array.from({ length: 50 }, () => b.next());
    expect(left).toEqual(right);
  });

  it('produces different sequences for different seeds', () => {
    const a = Array.from(
      { length: 50 },
      (
        (r) => () =>
          r.next()
      )(new Rng(1)),
    );
    const b = Array.from(
      { length: 50 },
      (
        (r) => () =>
          r.next()
      )(new Rng(2)),
    );
    expect(a).not.toEqual(b);
  });

  it('stays within [0, 1)', () => {
    const rng = new Rng(99);
    for (let i = 0; i < 1000; i++) {
      const value = rng.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('returns integers within range', () => {
    const rng = new Rng(7);
    for (let i = 0; i < 500; i++) {
      const value = rng.nextInt(4);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(4);
    }
  });

  it('replays the sequence after reset', () => {
    const rng = new Rng(2024);
    const first = [rng.next(), rng.next(), rng.next()];
    rng.reset();
    expect([rng.next(), rng.next(), rng.next()]).toEqual(first);
  });
});
