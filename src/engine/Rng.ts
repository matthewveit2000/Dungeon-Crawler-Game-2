/**
 * Rng — a small, fast, seedable pseudo-random number generator (mulberry32).
 *
 * Tier 1. Knows nothing about the game; it is a numeric primitive that exists
 * so every system depending on randomness can be made reproducible. A run
 * driven by the same seed must always produce the same world.
 */
export class Rng {
  private state: number;
  public readonly seed: number;

  constructor(seed: number) {
    // Normalise into an unsigned 32-bit integer so any input seeds cleanly.
    this.seed = seed >>> 0;
    this.state = this.seed;
  }

  /** Creates a generator seeded from the current wall clock. */
  public static random(): Rng {
    return new Rng((Date.now() ^ (Math.random() * 0xffffffff)) >>> 0);
  }

  /** Returns the next value in [0, 1). */
  public next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Returns an integer in [0, max). */
  public nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }

  /** Restarts the sequence from the original seed. */
  public reset(): void {
    this.state = this.seed;
  }
}
