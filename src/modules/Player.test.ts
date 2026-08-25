import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Player } from './Player';
import { InputManager } from '../engine/InputManager';
import { Application } from 'pixi.js';
import { Level } from './Level';
import { TileType } from './MapGenerator';

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

  it('collides with walls and stops moving', () => {
    // Create a mock level with walls everywhere except a small floor space
    const mockLevel = new Level(10, 10, 0); // 0 steps to generate just walls
    // The random walker generates floors randomly. We reset it to be deterministic for this test.
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        mockLevel.grid.set(x, y, TileType.WALL);
      }
    }
    // Set floor at (1, 1) and (1, 2)
    mockLevel.grid.set(1, 1, TileType.FLOOR);
    mockLevel.grid.set(1, 2, TileType.FLOOR);

    // Position player at (1 * 40 + 20, 1 * 40 + 20) = (60, 60) which is center of (1, 1) tile
    // Width and height of player is 40.
    const playerWithCollision = new Player('player-col', 60, 60, inputManager, mockLevel);

    // Try to move left into a wall (tile 0, 1)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    playerWithCollision.update(1);

    // Player X should be unchanged or nearly unchanged because it hit the wall immediately
    expect(playerWithCollision.x).toBe(60);

    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));

    // Move down into a floor (tile 1, 2)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 's' }));
    playerWithCollision.update(0.1); // Move 20 pixels down

    expect(playerWithCollision.y).toBe(60 + playerWithCollision.speed * 0.1); // 80
  });
});
