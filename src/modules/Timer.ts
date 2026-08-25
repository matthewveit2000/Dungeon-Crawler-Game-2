/**
 * Timer — manages the global 5-minute countdown clock.
 *
 * Tier 2. Keeps track of remaining time, deducting exact delta values per frame.
 * Does not depend on the system clock. Stops strictly at 0.
 */
export class Timer {
  private seconds: number;
  private onZeroCallback?: () => void;
  private hasFiredZero = false;

  constructor(initialSeconds = 300) {
    this.seconds = initialSeconds;
  }

  /** Registers a callback to be fired exactly once when the timer hits zero. */
  public setOnZeroCallback(callback: () => void): void {
    this.onZeroCallback = callback;
  }

  public get remainingSeconds(): number {
    return this.seconds;
  }

  /**
   * Advances the countdown by dt (delta time in seconds).
   * Does not go below zero.
   */
  public update(dt: number): void {
    if (this.seconds > 0) {
      this.seconds = Math.max(0, this.seconds - dt);
      this.checkZero();
    }
  }

  /** Allows the PM to override the timer (e.g. for instant death tests). */
  public setTime(seconds: number): void {
    this.seconds = Math.max(0, seconds);
    this.checkZero();
  }

  private checkZero(): void {
    if (this.seconds === 0 && !this.hasFiredZero) {
      this.hasFiredZero = true;
      if (this.onZeroCallback) {
        this.onZeroCallback();
      }
    }
  }

  /** Formats the remaining time as M:SS. */
  public toDisplayString(): string {
    const totalSeconds = Math.ceil(this.seconds);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
