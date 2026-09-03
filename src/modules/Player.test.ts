import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Player } from './Player';
import { Enemy } from './Enemy';
import { Level } from './Level';
import { TileType } from './MapGenerator';
import { InputManager } from '../engine/InputManager';

const STEP = 1 / 60;

/** Keys held down every frame; `justPressed` only on the first poll. */
const withKeys = (keys: Record<string, boolean>, tapOnce = true) => {
  const manager = new InputManager();
  let firstPoll = true;
  vi.spyOn(manager, 'getState').mockImplementation(() => {
    const justPressed = firstPoll || !tapOnce ? { ...keys } : {};
    firstPoll = false;
    return { keys, justPressed, mouse: { x: 0, y: 0, left: false, right: false } };
  });
  return manager;
};

/** A solid 10x10-tile level with only the named tiles carved open. */
const levelWith = (floors: [number, number][]) => {
  const level = new Level({ width: 10, height: 10, steps: 0, brushRadius: 0, seed: 1 });
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) level.grid.set(x, y, TileType.WALL);
  }
  for (const [x, y] of floors) level.grid.set(x, y, TileType.FLOOR);
  return level;
};

/** Runs a whole second of simulation at the fixed step. */
const runOneSecond = (player: Player) => {
  for (let i = 0; i < 60; i++) player.update(STEP);
};

describe('Player', () => {
  let inputManager: InputManager;

  beforeEach(() => {
    inputManager = new InputManager();
  });

  afterEach(() => {
    inputManager.destroy();
  });

  it('initializes with its position and view in step', () => {
    const player = new Player('player-1', 100, 100, inputManager);
    expect(player.id).toBe('player-1');
    expect(player.x).toBe(100);
    expect(player.y).toBe(100);
    expect(player.sprite.x).toBe(100);
    expect(player.sprite.y).toBe(100);
  });

  it('takes its size from the level tile size', () => {
    const level = levelWith([[1, 1]]);
    const player = new Player('p', 60, 60, inputManager, { level });
    expect(player.width).toBeGreaterThan(0);
    expect(player.width).toBeLessThan(level.tileSize);
    expect(player.width).toBe(player.height);
  });

  it('starts with 100 health by default', () => {
    const player = new Player('p', 60, 60, inputManager);
    expect(player.health).toBe(100);
  });

  it('zeroes health when die is called', () => {
    const player = new Player('p', 60, 60, inputManager);
    player.die();
    expect(player.health).toBe(0);
  });

  describe('movement', () => {
    const cases: [string, string, number, number][] = [
      ['up', 'w', 0, -1],
      ['down', 's', 0, 1],
      ['left', 'a', -1, 0],
      ['right', 'd', 1, 0],
    ];

    for (const [name, key, dx, dy] of cases) {
      it(`moves ${name} when ${key.toUpperCase()} is held`, () => {
        const player = new Player('p', 100, 100, withKeys({ [key]: true }));
        runOneSecond(player);
        expect(player.x).toBeCloseTo(100 + dx * player.speed, 4);
        expect(player.y).toBeCloseTo(100 + dy * player.speed, 4);
      });
    }

    it('also accepts the arrow keys', () => {
      const player = new Player('p', 100, 100, withKeys({ arrowright: true }));
      runOneSecond(player);
      expect(player.x).toBeCloseTo(100 + player.speed, 4);
    });

    it('normalizes diagonal movement to the same speed', () => {
      const player = new Player('p', 100, 100, withKeys({ w: true, d: true }));
      runOneSecond(player);
      const travelled = Math.hypot(player.x - 100, player.y - 100);
      expect(travelled).toBeCloseTo(player.speed, 4);
    });

    it('stands still with no keys held', () => {
      const player = new Player('p', 100, 100, withKeys({}));
      runOneSecond(player);
      expect(player.x).toBe(100);
      expect(player.y).toBe(100);
    });

    it('keeps its view in step with its position', () => {
      const player = new Player('p', 100, 100, withKeys({ d: true }));
      runOneSecond(player);
      expect(player.sprite.x).toBe(player.x);
      expect(player.sprite.y).toBe(player.y);
    });

    it('syncs the view after being repositioned externally', () => {
      // Descending a floor and teleporting both move the player this way.
      const player = new Player('p', 100, 100, withKeys({}));
      player.x = 900;
      player.y = 400;
      player.update(STEP);
      expect(player.sprite.x).toBe(900);
      expect(player.sprite.y).toBe(400);
    });
  });

  describe('collision', () => {
    // Positions come from the level's own tile geometry, never raw pixels.
    it('is blocked by a wall', () => {
      const level = levelWith([
        [1, 1],
        [1, 2],
      ]);
      const start = level.tileCenter(1, 1);
      const player = new Player('p', start.x, start.y, withKeys({ a: true }), { level });

      runOneSecond(player);

      expect(player.x).toBeGreaterThan(level.tileSize);
      expect(level.isCollidingWithWall(player.x, player.y, player.width, player.height)).toBe(
        false,
      );
    });

    it('moves freely into open floor', () => {
      const level = levelWith([
        [1, 1],
        [1, 2],
      ]);
      const start = level.tileCenter(1, 1);
      const player = new Player('p', start.x, start.y, withKeys({ s: true }), { level });

      for (let i = 0; i < 6; i++) player.update(STEP);

      expect(player.y).toBeGreaterThan(start.y);
    });

    it('never ends a frame inside a wall, whatever direction it is pushed', () => {
      const level = levelWith([
        [1, 1],
        [2, 1],
        [1, 2],
      ]); // (2,2) is the inside corner.
      const start = level.tileCenter(1, 1);
      const combos: Record<string, boolean>[] = [
        { w: true },
        { s: true },
        { a: true },
        { d: true },
        { w: true, a: true },
        { w: true, d: true },
        { s: true, a: true },
        { s: true, d: true },
      ];

      for (const keys of combos) {
        const player = new Player('p', start.x, start.y, withKeys(keys), { level });
        for (let i = 0; i < 120; i++) {
          player.update(STEP);
          expect(level.isCollidingWithWall(player.x, player.y, player.width, player.height)).toBe(
            false,
          );
        }
      }
    });

    it('stays free to move after being driven into a corner', () => {
      // The wedging bug: a corner cut used to leave the player unable to move at all.
      const level = levelWith([
        [1, 1],
        [2, 1],
        [1, 2],
      ]);
      const start = level.tileCenter(1, 1);
      const pusher = new Player('p', start.x, start.y, withKeys({ s: true, d: true }), { level });
      for (let i = 0; i < 120; i++) pusher.update(STEP);

      const directions: Record<string, boolean>[] = [
        { w: true },
        { a: true },
        { s: true },
        { d: true },
      ];
      const escaped = directions.filter((keys) => {
        const player = new Player('q', pusher.x, pusher.y, withKeys(keys), { level });
        const startX = player.x;
        const startY = player.y;
        runOneSecond(player);
        return Math.hypot(player.x - startX, player.y - startY) > 0.001;
      });

      expect(escaped.length).toBeGreaterThan(0);
    });

    it('cannot cross a wall even when handed an oversized step', () => {
      const level = levelWith([
        [1, 1],
        [3, 1],
      ]); // (2,1) is solid.
      const start = level.tileCenter(1, 1);
      const player = new Player('p', start.x, start.y, withKeys({ d: true }), { level });

      player.update(0.5); // A stalled frame.

      expect(player.x).toBeLessThan(level.tileSize * 2);
    });
  });

  describe('interaction', () => {
    const stubStaircase = (x: number, y: number) => ({ id: 'stairs', x, y }) as never;

    it('fires when the interact key is pressed in range', () => {
      const player = new Player('p', 0, 0, withKeys({ e: true }));
      let fired = 0;
      player.setStaircase(stubStaircase(10, 10));
      player.setInteractionCallback(() => {
        fired++;
      });

      player.update(STEP);
      expect(fired).toBe(1);
    });

    it('does not fire out of range', () => {
      const player = new Player('p', 0, 0, withKeys({ e: true }));
      let fired = 0;
      player.setStaircase(stubStaircase(500, 0));
      player.setInteractionCallback(() => {
        fired++;
      });

      player.update(STEP);
      expect(fired).toBe(0);
    });

    it('fires once per press, not once per frame', () => {
      const player = new Player('p', 0, 0, withKeys({ e: true }));
      let fired = 0;
      player.setStaircase(stubStaircase(10, 10));
      player.setInteractionCallback(() => {
        fired++;
      });

      for (let i = 0; i < 30; i++) player.update(STEP);
      expect(fired).toBe(1);
    });

    it('does not fire while the key is merely held', () => {
      const player = new Player('p', 0, 0, withKeys({ e: true }));
      let fired = 0;
      player.setStaircase(stubStaircase(10, 10));
      player.setInteractionCallback(() => {
        fired++;
      });

      player.update(STEP); // The press.
      expect(fired).toBe(1);
      for (let i = 0; i < 30; i++) player.update(STEP); // Still held.
      expect(fired).toBe(1);
    });
  });

  describe('animation state', () => {
    it('defaults to idle animation', () => {
      const player = new Player('p', 0, 0, inputManager);
      expect(player.currentAnimation).toBe('idle');
    });

    it('switches to walk animation when moving', () => {
      const level = levelWith([
        [1, 1],
        [2, 1],
      ]);
      const movingInput = withKeys({ d: true });
      const player = new Player('p', level.tileSize * 1.5, level.tileSize * 1.5, movingInput, {
        level,
      });

      player.update(STEP);
      expect(player.currentAnimation).toBe('walk');
    });

    it('returns to idle animation when stopped', () => {
      const level = levelWith([
        [1, 1],
        [2, 1],
      ]);
      const movingInput = withKeys({ d: true });
      const player = new Player('p', level.tileSize * 1.5, level.tileSize * 1.5, movingInput, {
        level,
      });

      player.update(STEP);
      expect(player.currentAnimation).toBe('walk');

      const idleInput = withKeys({});
      const idlePlayer = new Player('p2', level.tileSize * 1.5, level.tileSize * 1.5, idleInput, {
        level,
      });
      idlePlayer.update(STEP);
      expect(idlePlayer.currentAnimation).toBe('idle');
    });
  });

  describe('combat mechanics', () => {
    it('initializes with default weapon from pack (sword)', () => {
      const player = new Player('p', 100, 100, inputManager);
      expect(player.weapon.id).toBe('sword');
      expect(player.weapon.type).toBe('melee');
    });

    it('toggles weapon when switchWeapon key is pressed', () => {
      const input = withKeys({ q: true });
      const player = new Player('p', 100, 100, input);
      expect(player.weapon.id).toBe('sword');

      player.update(STEP);
      expect(player.weapon.id).toBe('bow');
      expect(player.weapon.type).toBe('ranged');
    });

    it('damages in-range enemies when attack key is pressed', () => {
      const input = withKeys({ ' ': true });
      const player = new Player('p', 100, 100, input);
      const enemy = new Enemy('goblin-1', 'goblin', 120, 100);
      const startHealth = enemy.health;
      player.setEnemyTargets([enemy]);

      player.update(STEP);

      expect(enemy.health).toBe(startHealth - player.weapon.damage);
    });

    it('spawns a projectile when attacking with ranged weapon', () => {
      let spawned = false;
      const input = withKeys({ ' ': true });
      const player = new Player('p', 100, 100, input, { weaponId: 'bow' });
      player.setSpawnProjectileCallback(() => {
        spawned = true;
      });

      player.update(STEP);

      expect(spawned).toBe(true);
    });
  });
});
