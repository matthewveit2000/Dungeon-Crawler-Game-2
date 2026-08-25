export type UpdateCallback = (dt: number) => void;

export interface GameLoopOptions {
  /** Length of one simulation step, in seconds. */
  fixedStep?: number;
  /**
   * Largest real-time span, in seconds, that a single frame may contribute to
   * the simulation. Anything longer is discarded rather than simulated.
   */
  maxFrameTime?: number;
}

const DEFAULT_FIXED_STEP = 1 / 60;
const DEFAULT_MAX_FRAME_TIME = 0.25;
const MAX_REPORTED_ERRORS = 5;

/**
 * GameLoop — a fixed-timestep ticker driven by requestAnimationFrame.
 *
 * Tier 1. The simulation always advances in identical `fixedStep` slices no
 * matter how long a real frame took, so physics, timers and AI produce the same
 * result on a 30Hz laptop and a 144Hz desktop.
 *
 * Two guards keep a stalled browser from corrupting the simulation:
 *
 * - Frames longer than `maxFrameTime` are truncated. A backgrounded tab
 *   suspends requestAnimationFrame entirely, so the first frame after returning
 *   can carry minutes of real time; simulating it would teleport every entity.
 * - The step count per frame is capped, so a machine that cannot keep up drops
 *   simulation time instead of spiralling into ever-longer frames.
 */
export class GameLoop {
  private readonly fixedStep: number;
  private readonly maxFrameTime: number;
  private readonly maxStepsPerFrame: number;

  private lastTime = 0;
  private accumulator = 0;
  private animationFrameId: number | null = null;
  private updateCallback: UpdateCallback | null = null;

  // FPS tracking, reported through window.audit.getFPS().
  private frameCount = 0;
  private lastFpsTime = 0;
  private currentFps = 0;
  private errorCount = 0;

  public isMenuOpen = false;

  constructor(options: GameLoopOptions = {}) {
    this.fixedStep = options.fixedStep ?? DEFAULT_FIXED_STEP;
    this.maxFrameTime = options.maxFrameTime ?? DEFAULT_MAX_FRAME_TIME;
    this.maxStepsPerFrame = Math.max(1, Math.ceil(this.maxFrameTime / this.fixedStep));
  }

  /** The constant slice of time handed to every update call, in seconds. */
  public get step(): number {
    return this.fixedStep;
  }

  /**
   * Begins ticking. `now` seeds the clock and exists so tests can drive
   * `advance()` from a known origin instead of from wall-clock time.
   */
  public start(callback: UpdateCallback, now: number = performance.now()): void {
    if (this.animationFrameId !== null) {
      return; // Already running.
    }

    this.updateCallback = callback;
    this.lastTime = now;
    this.lastFpsTime = this.lastTime;
    this.frameCount = 0;
    this.accumulator = 0;

    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  public stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public getFPS(): number {
    return this.currentFps;
  }

  /** How many update errors the loop has absorbed. */
  public getErrorCount(): number {
    return this.errorCount;
  }

  /**
   * Advances the simulation to `time`. Separated from the rAF callback so tests
   * can drive the loop deterministically without faking timers.
   */
  public advance(time: number): void {
    const frameTime = Math.min((time - this.lastTime) / 1000, this.maxFrameTime);
    this.lastTime = time;

    if (this.isMenuOpen) {
      this.accumulator = 0;
    } else {
      // Negative deltas are possible if a clock is adjusted mid-frame.
      this.accumulator += Math.max(0, frameTime);

      let steps = 0;
      while (this.accumulator >= this.fixedStep && steps < this.maxStepsPerFrame) {
        this.updateCallback?.(this.fixedStep);
        this.accumulator -= this.fixedStep;
        steps++;
      }

      // The machine could not keep up: drop the backlog rather than let it grow.
      if (steps === this.maxStepsPerFrame) {
        this.accumulator = 0;
      }
    }

    this.frameCount++;
    if (time - this.lastFpsTime >= 1000) {
      this.currentFps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsTime = time;
    }
  }

  private loop = (time: number): void => {
    try {
      this.advance(time);
    } catch (error) {
      // Graceful failure: a single bad frame must never stop the engine, or one
      // exception would freeze the game with no way back short of a reload.
      this.reportError(error);
    } finally {
      this.animationFrameId = requestAnimationFrame(this.loop);
    }
  };

  /** Logs a frame error, rate-limited so a persistent fault cannot flood the console. */
  private reportError(error: unknown): void {
    this.errorCount++;
    if (this.errorCount <= MAX_REPORTED_ERRORS) {
      console.error('[GameLoop] Error during update:', error);
      if (this.errorCount === MAX_REPORTED_ERRORS) {
        console.error('[GameLoop] Further update errors will be suppressed.');
      }
    }
  }
}
