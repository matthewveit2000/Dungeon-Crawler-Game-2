export interface AnimationTrack {
  /** Sequence of sprite keys to display in order. */
  frames: string[];
  /** Frames per second for playback. */
  fps: number;
  /** Whether the animation loops. Defaults to true. */
  loop?: boolean;
}

export type AnimationConfig = Record<string, AnimationTrack>;

/**
 * SpriteAnimator — deterministic, time-based frame sequence player.
 *
 * Tier 1 (Engine). It advances frame tracks by delta time `dt` without depending
 * on wall-clock time or frame rate, so playback is identical on any machine.
 */
export class SpriteAnimator {
  private readonly animations: AnimationConfig;
  private currentName: string | null = null;
  private currentTrack: AnimationTrack | null = null;
  private elapsedTime = 0;
  private currentFrameIndex = 0;

  constructor(animations: AnimationConfig = {}, defaultAnimation?: string) {
    this.animations = animations;
    if (defaultAnimation && this.animations[defaultAnimation]) {
      this.play(defaultAnimation);
    }
  }

  /**
   * Starts playing the named animation. If the animation is already playing,
   * continues uninterrupted without resetting elapsed time.
   */
  public play(name: string): void {
    if (this.currentName === name) return;
    const track = this.animations[name];
    if (!track || track.frames.length === 0) return;

    this.currentName = name;
    this.currentTrack = track;
    this.elapsedTime = 0;
    this.currentFrameIndex = 0;
  }

  /**
   * Advances the animation timer by `dt` seconds and returns the active sprite key.
   * Deterministic: the same total elapsed time always produces the exact same frame.
   */
  public update(dt: number): string | null {
    if (!this.currentTrack || this.currentTrack.frames.length === 0) return null;

    this.elapsedTime += dt;
    const { frames, fps, loop = true } = this.currentTrack;

    if (fps <= 0) {
      this.currentFrameIndex = 0;
      return frames[0];
    }

    const totalFrames = frames.length;
    const rawFrame = Math.floor(this.elapsedTime * fps);

    if (loop) {
      this.currentFrameIndex = rawFrame % totalFrames;
    } else {
      this.currentFrameIndex = Math.min(rawFrame, totalFrames - 1);
    }

    return frames[this.currentFrameIndex];
  }

  /** Name of the active animation, or null if none is playing. */
  public get animationName(): string | null {
    return this.currentName;
  }

  /** Sprite key of the currently displayed frame, or null. */
  public get currentFrame(): string | null {
    if (!this.currentTrack || this.currentTrack.frames.length === 0) return null;
    return this.currentTrack.frames[this.currentFrameIndex];
  }

  /** Index within the active frame array. */
  public get frameIndex(): number {
    return this.currentFrameIndex;
  }
}
