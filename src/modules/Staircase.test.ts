import { describe, it, expect } from 'vitest';
import { Staircase } from './Staircase';
import { TestSquare } from './TestSquare';
import interactables from '../packs/Interactables.json';
import debug from '../packs/Debug.json';

describe('Staircase', () => {
  it('takes its dimensions from the Tier 3 pack', () => {
    const staircase = new Staircase('stairs', 100, 200);
    expect(staircase.id).toBe('stairs');
    expect(staircase.x).toBe(100);
    expect(staircase.y).toBe(200);
    expect(staircase.width).toBe(interactables.staircase.width);
    expect(staircase.height).toBe(interactables.staircase.height);
  });

  it('places its view at its position', () => {
    const staircase = new Staircase('stairs', 100, 200);
    expect(staircase.sprite.x).toBe(100);
    expect(staircase.sprite.y).toBe(200);
  });

  it('does not move when updated', () => {
    const staircase = new Staircase('stairs', 100, 200);
    staircase.update(1 / 60);
    expect(staircase.x).toBe(100);
    expect(staircase.y).toBe(200);
  });
});

describe('TestSquare', () => {
  it('takes its appearance from the Tier 3 debug pack', () => {
    const square = new TestSquare('square', 10, 20);
    expect(square.width).toBe(debug.testSquare.width);
    expect(square.height).toBe(debug.testSquare.height);
  });

  it('spins at a rate independent of frame rate', () => {
    const oneBigStep = new TestSquare('a', 0, 0);
    oneBigStep.update(1);

    const manySmallSteps = new TestSquare('b', 0, 0);
    for (let i = 0; i < 60; i++) manySmallSteps.update(1 / 60);

    expect(manySmallSteps.sprite.rotation).toBeCloseTo(oneBigStep.sprite.rotation, 6);
  });
});
