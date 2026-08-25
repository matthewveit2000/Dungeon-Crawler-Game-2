import { expect, test, describe, vi } from 'vitest';
import { Staircase } from './Staircase';
import { Player } from './Player';
import { InputManager } from '../engine/InputManager';
import interactables from '../packs/Interactables.json';

describe('Staircase Entity', () => {
  test('initializes with correct properties from JSON', () => {
    const staircase = new Staircase('test-staircase', 100, 100);

    expect(staircase.id).toBe('test-staircase');
    expect(staircase.x).toBe(100);
    expect(staircase.y).toBe(100);
    expect(staircase.width).toBe(interactables.staircase.width);
    expect(staircase.height).toBe(interactables.staircase.height);
  });
});

describe('Player Interaction', () => {
  test('interacts with staircase when e is pressed and within range', () => {
    const inputManager = new InputManager();
    const player = new Player('player', 0, 0, inputManager);
    const staircase = new Staircase('stairs', 10, 10);

    let interactionTriggered = false;
    player.setStaircase(staircase);
    player.setInteractionCallback(() => {
      interactionTriggered = true;
    });

    // Mock key press
    vi.spyOn(inputManager, 'getState').mockReturnValue({ keys: { 'e': true }, mouse: { x: 0, y: 0, left: false, right: false } });

    // Distance is sqrt(100 + 100) = ~14.14 < 60
    player.update(1/60);

    expect(interactionTriggered).toBe(true);
  });

  test('does not interact if out of range', () => {
    const inputManager = new InputManager();
    const player = new Player('player', 0, 0, inputManager);
    // Set staircase out of range (distance 100)
    const staircase = new Staircase('stairs', 100, 0);

    let interactionTriggered = false;
    player.setStaircase(staircase);
    player.setInteractionCallback(() => {
      interactionTriggered = true;
    });

    // Mock key press
    vi.spyOn(inputManager, 'getState').mockReturnValue({ keys: { 'e': true }, mouse: { x: 0, y: 0, left: false, right: false } });

    player.update(1/60);

    expect(interactionTriggered).toBe(false);
  });
});
