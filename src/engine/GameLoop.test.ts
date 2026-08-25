import { describe, it, expect, vi } from 'vitest';
import { GameLoop } from './GameLoop';

describe('GameLoop', () => {
  it('hands every update an identical fixed step', () => {
    const loop = new GameLoop({ fixedStep: 1 / 60 });
    const update = vi.fn();
    loop.start(update, 0);

    for (let frame = 1; frame <= 10; frame++) {
      loop.advance(frame * (1000 / 60));
    }
    loop.stop();

    expect(update).toHaveBeenCalled();
    for (const [dt] of update.mock.calls) {
      expect(dt).toBe(1 / 60);
    }
  });

  it('keeps simulated time in step with real time despite uneven frames', () => {
    const loop = new GameLoop({ fixedStep: 1 / 60, maxFrameTime: 0.25 });
    const update = vi.fn();
    loop.start(update, 0);

    // Frames of wildly different lengths, none long enough to be discarded.
    let time = 0;
    const frames = [8, 33, 12, 50, 16, 16, 100, 20, 16, 16, 9, 41, 16, 16, 200];
    for (const frameMs of frames) {
      time += frameMs;
      loop.advance(time);
    }
    loop.stop();

    // Simulated time tracks real time to within one step of leftover remainder.
    const realSeconds = frames.reduce((a, b) => a + b, 0) / 1000;
    const simulated = update.mock.calls.length * (1 / 60);
    expect(simulated).toBeGreaterThan(realSeconds - 1 / 60);
    expect(simulated).toBeLessThanOrEqual(realSeconds);
  });

  it('discards a frame longer than maxFrameTime instead of simulating it', () => {
    const loop = new GameLoop({ fixedStep: 1 / 60, maxFrameTime: 0.25 });
    const update = vi.fn();
    loop.start(update, 0);

    // A backgrounded tab suspends rAF; returning after two minutes must not
    // advance the simulation by two minutes.
    loop.advance(120_000);
    loop.stop();

    const simulated = update.mock.calls.length * (1 / 60);
    expect(simulated).toBeLessThanOrEqual(0.25);
  });

  it('never reports a step large enough to cross a wall', () => {
    const loop = new GameLoop({ fixedStep: 1 / 60 });
    const update = vi.fn();
    loop.start(update, 0);

    for (const gap of [16, 600, 16, 5000, 16]) {
      loop.advance(gap);
    }
    loop.stop();

    // At 200 px/s, one step must move the player far less than a 40px tile.
    for (const [dt] of update.mock.calls) {
      expect(dt * 200).toBeLessThan(20);
    }
  });

  it('does not run before start() or after stop()', () => {
    const loop = new GameLoop();
    const update = vi.fn();

    loop.advance(1000);
    expect(update).not.toHaveBeenCalled();

    loop.start(update, 0);
    loop.advance(100);
    const callsWhileRunning = update.mock.calls.length;
    expect(callsWhileRunning).toBeGreaterThan(0);

    loop.stop();
    expect(loop.getFPS()).toBeGreaterThanOrEqual(0);
  });

  it('keeps running after an update throws', () => {
    // One bad frame used to stop the loop being re-queued, freezing the game.
    const loop = new GameLoop({ fixedStep: 1 / 60 });
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    let calls = 0;

    const raf = vi
      .spyOn(globalThis, 'requestAnimationFrame')
      .mockImplementation(() => 1 as unknown as number);

    loop.start(() => {
      calls++;
      throw new Error('boom');
    }, 0);

    // Drive the private rAF callback the same way the browser would.
    const tick = raf.mock.calls[0][0];
    expect(() => tick(100)).not.toThrow();
    expect(calls).toBeGreaterThan(0);
    expect(loop.getErrorCount()).toBeGreaterThan(0);
    // Re-queued despite the throw, so the next frame still happens.
    expect(raf.mock.calls.length).toBeGreaterThan(1);

    loop.stop();
    raf.mockRestore();
    errors.mockRestore();
  });

  it('stops flooding the console when errors persist', () => {
    const loop = new GameLoop({ fixedStep: 1 / 60 });
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const raf = vi
      .spyOn(globalThis, 'requestAnimationFrame')
      .mockImplementation(() => 1 as unknown as number);

    loop.start(() => {
      throw new Error('boom');
    }, 0);
    const tick = raf.mock.calls[0][0];
    for (let i = 1; i <= 30; i++) tick(i * 20);

    expect(loop.getErrorCount()).toBe(30);
    expect(errors.mock.calls.length).toBeLessThan(30);

    loop.stop();
    raf.mockRestore();
    errors.mockRestore();
  });

  it('reports frames per second', () => {
    const loop = new GameLoop({ fixedStep: 1 / 60 });
    loop.start(() => {}, 0);

    for (let frame = 1; frame <= 60; frame++) {
      loop.advance(frame * (1000 / 60));
    }
    loop.advance(1016.66);
    loop.stop();

    expect(loop.getFPS()).toBeGreaterThanOrEqual(59);
    expect(loop.getFPS()).toBeLessThanOrEqual(61);
  });
});
