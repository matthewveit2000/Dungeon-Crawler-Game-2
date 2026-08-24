import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Player } from './Player';
import { InputManager } from '../engine/InputManager';
import { Application } from 'pixi.js';

describe('Player', () => {
  let inputManager: InputManager;
  let player: Player;
  let app: Application;

  beforeEach(async () => {
    // We instantiate an Application just to safely satisfy any internal Pixi dependencies if needed,
    // though the Player graphics just uses basic containers and graphics.
    app = new Application();
    await app.init();

    inputManager = new InputManager();
    player = new Player('player-1', 100, 100, inputManager);
  });

  afterEach(() => {
    inputManager.destroy();
    app.destroy(true, { children: true, texture: true });
  });

  it('initializes with correct properties', () => {
    expect(player.id).toBe('player-1');
    expect(player.x).toBe(100);
    expect(player.y).toBe(100);
    expect(player.sprite.x).toBe(100);
    expect(player.sprite.y).toBe(100);
  });

  it('moves up when W is pressed', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));

    const dt = 1; // 1 second
    player.update(dt);

    expect(player.y).toBe(100 - player.speed * dt); // Should decrease Y
    expect(player.x).toBe(100);
    expect(player.sprite.y).toBe(100 - player.speed * dt);
  });

  it('moves down when S is pressed', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 's' }));

    const dt = 1;
    player.update(dt);

    expect(player.y).toBe(100 + player.speed * dt); // Should increase Y
    expect(player.x).toBe(100);
    expect(player.sprite.y).toBe(100 + player.speed * dt);
  });

  it('moves left when A is pressed', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));

    const dt = 1;
    player.update(dt);

    expect(player.x).toBe(100 - player.speed * dt); // Should decrease X
    expect(player.y).toBe(100);
    expect(player.sprite.x).toBe(100 - player.speed * dt);
  });

  it('moves right when D is pressed', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));

    const dt = 1;
    player.update(dt);

    expect(player.x).toBe(100 + player.speed * dt); // Should increase X
    expect(player.y).toBe(100);
    expect(player.sprite.x).toBe(100 + player.speed * dt);
  });

  it('normalizes diagonal movement speed', () => {
    // Press W and D
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));

    const dt = 1;
    player.update(dt);

    // Diagonal distance should equal the speed
    const dx = player.x - 100;
    const dy = player.y - 100;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Be generous with precision
    expect(distance).toBeCloseTo(player.speed, 5);
  });

  it('stops when keys are released', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
    player.update(0.5); // Move for 0.5s
    const yAfterMove = player.y;

    expect(yAfterMove).toBeLessThan(100); // Moved up

    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'w' }));
    player.update(0.5); // Move for another 0.5s

    // Position should be exactly the same since input stopped
    expect(player.y).toBe(yAfterMove);
  });
});
