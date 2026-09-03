import { describe, it, expect } from 'vitest';
import { SpriteAnimator } from './SpriteAnimator';

describe('SpriteAnimator', () => {
  const config = {
    idle: {
      fps: 2,
      frames: ['idle_0', 'idle_1'],
    },
    walk: {
      fps: 8,
      frames: ['walk_0', 'walk_1', 'walk_2', 'walk_3'],
    },
  };

  it('starts with default animation if specified', () => {
    const animator = new SpriteAnimator(config, 'idle');
    expect(animator.animationName).toBe('idle');
    expect(animator.currentFrame).toBe('idle_0');
    expect(animator.frameIndex).toBe(0);
  });

  it('advances frames deterministically over time', () => {
    const animator = new SpriteAnimator(config, 'walk');
    // At 8 fps, each frame lasts 1/8 = 0.125s.
    expect(animator.currentFrame).toBe('walk_0');

    animator.update(0.125);
    expect(animator.currentFrame).toBe('walk_1');
    expect(animator.frameIndex).toBe(1);

    animator.update(0.125);
    expect(animator.currentFrame).toBe('walk_2');
    expect(animator.frameIndex).toBe(2);

    animator.update(0.125);
    expect(animator.currentFrame).toBe('walk_3');
    expect(animator.frameIndex).toBe(3);

    // Loops back to frame 0
    animator.update(0.125);
    expect(animator.currentFrame).toBe('walk_0');
    expect(animator.frameIndex).toBe(0);
  });

  it('produces the exact same frame for identical elapsed time regardless of how updates are divided', () => {
    // TDD Criterion: "the same elapsed time always produces the same frame regardless of how it was divided into updates"
    const animatorSingleStep = new SpriteAnimator(config, 'walk');
    const animatorMultiStep = new SpriteAnimator(config, 'walk');
    const animatorTinySteps = new SpriteAnimator(config, 'walk');

    const totalDuration = 0.3125; // 2.5 frames into walk animation

    // Single large update
    animatorSingleStep.update(totalDuration);

    // 5 updates of equal duration
    const numSteps = 5;
    for (let i = 0; i < numSteps; i++) {
      animatorMultiStep.update(totalDuration / numSteps);
    }

    // 60Hz tick simulation
    const fixedStep = 1 / 60;
    let accumulated = 0;
    while (accumulated + fixedStep <= totalDuration) {
      animatorTinySteps.update(fixedStep);
      accumulated += fixedStep;
    }
    if (totalDuration - accumulated > 0) {
      animatorTinySteps.update(totalDuration - accumulated);
    }

    expect(animatorSingleStep.frameIndex).toBe(2);
    expect(animatorMultiStep.frameIndex).toBe(2);
    expect(animatorTinySteps.frameIndex).toBe(2);
    expect(animatorSingleStep.currentFrame).toBe('walk_2');
    expect(animatorMultiStep.currentFrame).toBe('walk_2');
    expect(animatorTinySteps.currentFrame).toBe('walk_2');
  });

  it('resets elapsed time when switching to a different animation', () => {
    const animator = new SpriteAnimator(config, 'idle');
    animator.update(0.4); // Well into idle animation

    animator.play('walk');
    expect(animator.animationName).toBe('walk');
    expect(animator.currentFrame).toBe('walk_0');
    expect(animator.frameIndex).toBe(0);
  });

  it('does not reset elapsed time when play is called with the active animation', () => {
    const animator = new SpriteAnimator(config, 'walk');
    animator.update(0.13); // Frame 1
    expect(animator.frameIndex).toBe(1);

    animator.play('walk');
    expect(animator.frameIndex).toBe(1);
  });

  it('stops at the final frame when loop is false', () => {
    const nonLoopingConfig = {
      death: {
        fps: 4,
        frames: ['d_0', 'd_1', 'd_2'],
        loop: false,
      },
    };
    const animator = new SpriteAnimator(nonLoopingConfig, 'death');
    animator.update(10.0); // Far past end of animation
    expect(animator.currentFrame).toBe('d_2');
    expect(animator.frameIndex).toBe(2);
  });
});
