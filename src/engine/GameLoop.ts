export type UpdateCallback = (dt: number) => void;

export class GameLoop {
  private lastTime: number = 0;
  private animationFrameId: number | null = null;
  private updateCallback: UpdateCallback | null = null;

  // FPS Tracking
  private frameCount: number = 0;
  private lastFpsTime: number = 0;
  private currentFps: number = 0;

  public start(callback: UpdateCallback): void {
    if (this.animationFrameId !== null) {
      return; // Already running
    }

    this.updateCallback = callback;
    // We use performance.now() if available in tests, else Date.now()
    this.lastTime = performance ? performance.now() : Date.now();
    this.lastFpsTime = this.lastTime;
    this.frameCount = 0;

    this.loop(this.lastTime);
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

  private loop = (time: number): void => {
    // Fallback to performance.now() if time is not provided reliably
    const currentTime = time || (performance ? performance.now() : Date.now());

    // Calculate delta time in seconds
    const dt = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // Execute callback
    if (this.updateCallback) {
      this.updateCallback(dt);
    }

    // Calculate FPS
    this.frameCount++;
    if (currentTime - this.lastFpsTime >= 1000) {
      this.currentFps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsTime = currentTime;
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  };
}
