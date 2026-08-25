import { Entity } from '../engine/Entity';
import { InputManager } from '../engine/InputManager';
import { parseColor } from '../engine/View';
import { Level } from './Level';
import { resolveMovement } from './Movement';
import playerPack from '../packs/Player.json';
import controls from '../packs/Controls.json';
import world from '../packs/World.json';

export interface PlayerOptions {
  level?: Level;
  /** Overrides the size derived from the level's tile size. */
  size?: number;
  speed?: number;
}

/** Tile size used when a player is created without a level to scale against. */
const FALLBACK_TILE_SIZE = world.tileSize;

/**
 * Player — the character the player drives.
 *
 * Tier 2. Reads its stats from the Tier 3 player pack and its keys from the
 * controls pack, then asks the shared movement resolver to carry it through the
 * level. It holds no rendering code of its own.
 */
export class Player extends Entity {
  public readonly speed: number;

  private readonly inputManager: InputManager;
  private readonly level?: Level;
  private readonly interactRadius: number;
  private readonly maxStep: number;

  private staircase?: Entity;
  private onInteract?: () => void;

  constructor(
    id: string,
    x: number,
    y: number,
    inputManager: InputManager,
    options: PlayerOptions = {},
  ) {
    const tileSize = options.level?.tileSize ?? FALLBACK_TILE_SIZE;

    // The collision box is deliberately a fraction of the sprite. A 64x64
    // character sprite that collided across its full width could not fit
    // anywhere its art suggests it should; the box represents the feet.
    const size = options.size ?? Math.round(tileSize * playerPack.sizeRatio);

    super(id, x, y, { width: size, height: size, color: parseColor(playerPack.color) });

    this.inputManager = inputManager;
    this.level = options.level;
    this.speed = options.speed ?? playerPack.speed;
    this.interactRadius = playerPack.interactRadius;

    // Never advance more than half a tile between collision tests, so no amount
    // of movement in one step can skip over a wall.
    this.maxStep = tileSize / 2;
  }

  public setStaircase(staircase: Entity): void {
    this.staircase = staircase;
  }

  public setInteractionCallback(callback: () => void): void {
    this.onInteract = callback;
  }

  public update(dt: number): void {
    const state = this.inputManager.getState();

    this.handleInteraction(state.justPressed);
    this.handleMovement(state.keys, dt);

    // Unconditional, so external repositioning (descending, teleports) is
    // reflected without every caller having to move the sprite by hand.
    this.syncView();
  }

  /**
   * Reads the edge state rather than the held state, so holding the key cannot
   * fire repeatedly and a tap shorter than one frame is not lost.
   */
  private handleInteraction(justPressed: Record<string, boolean>): void {
    if (!isActionPressed(justPressed, controls.interact)) return;
    if (!this.staircase || !this.onInteract) return;

    const dx = this.x - this.staircase.x;
    const dy = this.y - this.staircase.y;

    if (Math.hypot(dx, dy) < this.interactRadius) {
      this.onInteract();
    }
  }

  private handleMovement(keys: Record<string, boolean>, dt: number): void {
    let dx = 0;
    let dy = 0;

    if (isActionPressed(keys, controls.moveUp)) dy -= 1;
    if (isActionPressed(keys, controls.moveDown)) dy += 1;
    if (isActionPressed(keys, controls.moveLeft)) dx -= 1;
    if (isActionPressed(keys, controls.moveRight)) dx += 1;

    if (dx === 0 && dy === 0) return;

    // Normalised, so travelling diagonally is no faster than travelling straight.
    const length = Math.hypot(dx, dy);
    const delta = {
      x: (dx / length) * this.speed * dt,
      y: (dy / length) * this.speed * dt,
    };

    if (!this.level) {
      this.x += delta.x;
      this.y += delta.y;
      return;
    }

    const level = this.level;
    const next = resolveMovement(
      (x, y, width, height) => level.isCollidingWithWall(x, y, width, height),
      {
        from: { x: this.x, y: this.y },
        delta,
        width: this.width,
        height: this.height,
        maxStep: this.maxStep,
      },
    );

    this.x = next.x;
    this.y = next.y;
  }
}

/** True when any key bound to an action is currently held. */
function isActionPressed(keys: Record<string, boolean>, bindings: string[]): boolean {
  return bindings.some((key) => keys[key] === true);
}
