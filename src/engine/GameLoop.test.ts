import { describe, it, expect, vi } from 'vitest';
import { GameLoop } from './GameLoop';

describe('GameLoop', () => {
  // To avoid vitest fake timer headaches with requestAnimationFrame,
  // we will manually call the loop method for our TDD tests.

  it('should calculate delta time consistently across multiple simulated frames', () => {
    const loop = new GameLoop();
    const updateSpy = vi.fn();

    // We can inject time directly into loop.loop()
    // by making loop a public method for testing, or casting to any
    const anyLoop = loop as any;

    // Initial start time
    anyLoop.lastTime = 0;
    anyLoop.lastFpsTime = 0;
    anyLoop.updateCallback = updateSpy;

    // Simulate 10 frames passing 16.66ms each
    for (let i = 1; i <= 10; i++) {
      const simulatedTime = i * (1000 / 60);
      anyLoop.loop(simulatedTime);
    }

    expect(updateSpy).toHaveBeenCalled();

    const calls = updateSpy.mock.calls;
    for (let i = 0; i < calls.length; i++) {
      const dt = calls[i][0];
      expect(dt).toBeGreaterThan(0.015);
      expect(dt).toBeLessThan(0.018);
    }
  });

  it('should compute FPS correctly', () => {
    const loop = new GameLoop();
    const updateSpy = vi.fn();
    const anyLoop = loop as any;

    anyLoop.lastTime = 0;
    anyLoop.lastFpsTime = 0;
    anyLoop.updateCallback = updateSpy;

    // Simulate 60 frames passing 16.66ms each
    for (let i = 1; i <= 60; i++) {
      const simulatedTime = i * (1000 / 60);
      anyLoop.loop(simulatedTime);
    }

    // Next frame happens at 1016.66ms, surpassing 1000ms delta for FPS calculation
    anyLoop.loop(1016.66);

    const fps = loop.getFPS();
    // In this exact scenario, we ran 60 frames before the 1000ms threshold check hit,
    // plus the current frame triggered it.
    expect(fps).toBeGreaterThanOrEqual(60);
    expect(fps).toBeLessThanOrEqual(61);
  });
});
