import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Container } from 'pixi.js';
import { EntityManager } from '../engine/EntityManager';
import { InputManager } from '../engine/InputManager';
import { Entity } from '../engine/Entity';
import { FloorManager } from './FloorManager';
import { Level } from './Level';
import { TestSquare } from './TestSquare';
import { TileType } from './MapGenerator';

const setup = (seed = 42) => {
  const stage = new Container();
  const entityManager = new EntityManager(stage);
  const inputManager = new InputManager();
  const level = new Level({ width: 40, height: 40, steps: 900, brushRadius: 1, seed });
  const onFloorBuilt = vi.fn();
  const floors = new FloorManager(level, entityManager, inputManager, onFloorBuilt);
  return { stage, entityManager, inputManager, level, floors, onFloorBuilt };
};

describe('FloorManager', () => {
  let context: ReturnType<typeof setup>;

  beforeEach(() => {
    context = setup();
  });

  it('builds a floor with a player and a staircase', () => {
    const player = context.floors.build();

    expect(context.floors.getPlayer()).toBe(player);
    expect(context.floors.getStaircase()).not.toBeNull();
    expect(context.entityManager.getEntities().length).toBe(2 + context.floors.getEnemies().length);
  });

  it('spawns the player on standable floor', () => {
    const player = context.floors.build();
    expect(context.level.isCollidingWithWall(player.x, player.y, player.width, player.height)).toBe(
      false,
    );
  });

  it('places the staircase far from the spawn point', () => {
    context.floors.build();
    const player = context.floors.getPlayer()!;
    const stairs = context.floors.getStaircase()!;
    const distance = Math.hypot(stairs.x - player.x, stairs.y - player.y);
    expect(distance).toBeGreaterThan(context.level.tileSize * 5);
  });

  it('places the staircase on a floor tile', () => {
    context.floors.build();
    const stairs = context.floors.getStaircase()!;
    const tileX = Math.floor(stairs.x / context.level.tileSize);
    const tileY = Math.floor(stairs.y / context.level.tileSize);
    expect(context.level.grid.get(tileX, tileY)).toBe(TileType.FLOOR);
  });

  it('tells the renderer whenever a floor is built', () => {
    context.floors.build();
    expect(context.onFloorBuilt).toHaveBeenCalledWith(context.level);
  });

  describe('descend', () => {
    it('generates a new floor and counts the depth', () => {
      context.floors.build();
      expect(context.floors.currentDepth).toBe(1);

      const before = context.level.grid;
      context.floors.descend();
      context.floors.update();

      expect(context.floors.currentDepth).toBe(2);
      expect(context.level.grid).not.toBe(before);
    });

    it('wipes every entity from the previous floor', () => {
      context.floors.build();
      const countBefore = context.entityManager.getEntities().length;
      const stray = new TestSquare('stray', 0, 0);
      context.entityManager.addEntity(stray);
      expect(context.entityManager.getEntities()).toHaveLength(countBefore + 1);

      context.floors.descend();
      context.floors.update();

      // Leftovers used to survive every descent, so the floor was never wiped.
      expect(context.entityManager.getEntity('stray')).toBeUndefined();
      expect(stray.isDestroyed).toBe(true);
      expect(context.entityManager.getEntities().length).toBe(
        2 + context.floors.getEnemies().length,
      );
    });

    it('does not leave the stage growing across many descents', () => {
      context.floors.build();
      for (let i = 0; i < 25; i++) {
        context.floors.descend();
        context.floors.update();
      }
      expect(context.stage.children.length).toBe(2 + context.floors.getEnemies().length);
      expect(context.entityManager.getEntities().length).toBe(
        2 + context.floors.getEnemies().length,
      );
    });

    it('leaves the player standing somewhere valid on the new floor', () => {
      context.floors.build();
      for (let i = 0; i < 10; i++) {
        context.floors.descend();
        context.floors.update();
        const player = context.floors.getPlayer()!;
        expect(
          context.level.isCollidingWithWall(player.x, player.y, player.width, player.height),
        ).toBe(false);
      }
    });

    it('keeps the player view in step after descending', () => {
      context.floors.build();
      context.floors.descend();
      context.floors.update();
      const player = context.floors.getPlayer()!;
      expect(player.sprite.x).toBe(player.x);
      expect(player.sprite.y).toBe(player.y);
    });
  });

  describe('deferred descent', () => {
    it('queues the request rather than rebuilding immediately', () => {
      const player = context.floors.build();
      context.floors.descend();

      expect(context.floors.isDescendPending).toBe(true);
      expect(context.floors.getPlayer()).toBe(player); // Not yet replaced.

      context.floors.update();
      expect(context.floors.isDescendPending).toBe(false);
      expect(context.floors.getPlayer()).not.toBe(player);
    });

    it('does nothing on update when no descent was requested', () => {
      const player = context.floors.build();
      context.floors.update();
      expect(context.floors.getPlayer()).toBe(player);
      expect(context.floors.currentDepth).toBe(1);
    });

    it('survives a player triggering a descent from inside its own update', () => {
      // Tearing the player down mid-update used to throw and kill the loop.
      context.floors.build();
      context.floors.teleportToStaircase();

      vi.spyOn(context.inputManager, 'getState').mockReturnValue({
        keys: { e: true },
        justPressed: { e: true },
        mouse: { x: 0, y: 0, left: false, right: false },
      });

      expect(() => {
        for (let frame = 0; frame < 5; frame++) {
          context.entityManager.update(1 / 60);
          context.floors.update();
        }
      }).not.toThrow();

      expect(context.floors.currentDepth).toBeGreaterThan(1);
    });

    it('collapses repeated requests into a single descent', () => {
      context.floors.build();
      context.floors.descend();
      context.floors.descend();
      context.floors.update();
      expect(context.floors.currentDepth).toBe(2);
    });
  });

  describe('teleportToStaircase', () => {
    it('moves the player onto the stairs and syncs the view', () => {
      context.floors.build();
      expect(context.floors.teleportToStaircase()).toBe(true);

      const player = context.floors.getPlayer()!;
      const stairs = context.floors.getStaircase()!;
      expect(player.x).toBe(stairs.x);
      expect(player.sprite.x).toBe(stairs.x);
    });

    it('reports failure before a floor has been built', () => {
      expect(context.floors.teleportToStaircase()).toBe(false);
    });

    it('puts the player within interaction range of the stairs', () => {
      context.floors.build();
      context.floors.teleportToStaircase();

      const player = context.floors.getPlayer()!;
      let descended = false;
      const staircase = context.floors.getStaircase() as Entity;
      player.setStaircase(staircase);
      player.setInteractionCallback(() => {
        descended = true;
      });

      vi.spyOn(context.inputManager, 'getState').mockReturnValue({
        keys: { e: true },
        justPressed: { e: true },
        mouse: { x: 0, y: 0, left: false, right: false },
      });
      player.update(1 / 60);

      expect(descended).toBe(true);
    });
  });

  describe('restartFromSeed', () => {
    it('rebuilds the same run from the same seed', () => {
      context.floors.build();
      context.floors.restartFromSeed(1234);
      const first = context.floors.getStaircase()!;
      const position = { x: first.x, y: first.y };

      context.floors.restartFromSeed(1234);
      const second = context.floors.getStaircase()!;

      expect({ x: second.x, y: second.y }).toEqual(position);
      expect(context.floors.currentDepth).toBe(1);
    });
  });

  describe('combat entity lifecycle', () => {
    it('removes killed enemies from the active enemies list and entityManager', () => {
      context.floors.build();
      const enemies = context.floors.getEnemies();
      const initialCount = enemies.length;
      expect(initialCount).toBeGreaterThan(0);

      const targetEnemy = enemies[0];
      targetEnemy.takeDamage(1000); // Lethal damage

      context.floors.update();

      expect(context.floors.getEnemies()).toHaveLength(initialCount - 1);
      expect(context.entityManager.getEntity(targetEnemy.id)).toBeUndefined();
      expect(targetEnemy.isDestroyed).toBe(true);
    });
  });
});
