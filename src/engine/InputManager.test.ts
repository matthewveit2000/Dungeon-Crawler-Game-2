import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { InputManager } from './InputManager';

describe('InputManager', () => {
  let inputManager: InputManager;

  beforeEach(() => {
    inputManager = new InputManager();
  });

  afterEach(() => {
    inputManager.destroy();
  });

  it('initializes with default state', () => {
    const state = inputManager.getState();
    expect(state.keys).toEqual({});
    expect(state.mouse).toEqual({
      x: 0,
      y: 0,
      left: false,
      right: false,
    });
  });

  it('captures keydown events and converts to lowercase', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'W' }));

    const state = inputManager.getState();
    expect(state.keys['w']).toBe(true);
  });

  it('captures keyup events', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'A' }));
    let state = inputManager.getState();
    expect(state.keys['a']).toBe(true);

    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));
    state = inputManager.getState();
    expect(state.keys['a']).toBe(false);
  });

  it('captures mouse movement', () => {
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 200 }));

    const state = inputManager.getState();
    expect(state.mouse.x).toBe(100);
    expect(state.mouse.y).toBe(200);
  });

  it('captures left mouse button press and release', () => {
    window.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));
    let state = inputManager.getState();
    expect(state.mouse.left).toBe(true);
    expect(state.mouse.right).toBe(false);

    window.dispatchEvent(new MouseEvent('mouseup', { button: 0 }));
    state = inputManager.getState();
    expect(state.mouse.left).toBe(false);
  });

  it('captures right mouse button press and release', () => {
    window.dispatchEvent(new MouseEvent('mousedown', { button: 2 }));
    let state = inputManager.getState();
    expect(state.mouse.right).toBe(true);
    expect(state.mouse.left).toBe(false);

    window.dispatchEvent(new MouseEvent('mouseup', { button: 2 }));
    state = inputManager.getState();
    expect(state.mouse.right).toBe(false);
  });

  it('prevents default on contextmenu', () => {
    const event = new MouseEvent('contextmenu');
    let preventDefaultCalled = false;
    event.preventDefault = () => { preventDefaultCalled = true; };

    window.dispatchEvent(event);
    expect(preventDefaultCalled).toBe(true);
  });
});
