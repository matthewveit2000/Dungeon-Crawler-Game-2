import { EntityManager } from '../engine/EntityManager';
import { InputManager } from '../engine/InputManager';
import { Level } from './Level';
import { Player } from './Player';
import { Staircase } from './Staircase';

const PLAYER_ID = 'player-1';
const STAIRCASE_ID = 'staircase-1';

/**
 * FloorManager — owns the lifecycle of a dungeon floor.
 *
 * Tier 2. Building a floor, placing the player and staircase, and wiping
 * everything on descent are game rules, so they live here rather than in the
 * application bootstrap. Descending clears the entire entity set, which is what
 * "wipe the current floor" has to mean if memory is to be released.
 */
export class FloorManager {
  public readonly level: Level;

  private readonly entityManager: EntityManager;
  private readonly inputManager: InputManager;
  private readonly onFloorBuilt: (level: Level) => void;

  private player: Player | null = null;
  private staircase: Staircase | null = null;
  private depth = 1;
  private descendRequested = false;

  constructor(
    level: Level,
    entityManager: EntityManager,
    inputManager: InputManager,
    onFloorBuilt: (level: Level) => void,
  ) {
    this.level = level;
    this.entityManager = entityManager;
    this.inputManager = inputManager;
    this.onFloorBuilt = onFloorBuilt;
  }

  /** How many floors deep the run currently is, counting from one. */
  public get currentDepth(): number {
    return this.depth;
  }

  public getPlayer(): Player | null {
    return this.player;
  }

  public getStaircase(): Staircase | null {
    return this.staircase;
  }

  /** Populates the current floor with a player and a staircase. */
  public build(): Player {
    this.entityManager.clear();

    const spawn = this.level.spawnPoint;
    const player = new Player(PLAYER_ID, spawn.x, spawn.y, this.inputManager, {
      level: this.level,
    });

    const exit = this.level.findFarthestFloor(spawn.x, spawn.y);
    const staircase = new Staircase(STAIRCASE_ID, exit.x, exit.y);

    // The staircase is added first so the player renders above it.
    this.entityManager.addEntity(staircase);
    this.entityManager.addEntity(player);

    player.setStaircase(staircase);
    player.setInteractionCallback(() => this.descend());
    this.descendRequested = false;

    this.player = player;
    this.staircase = staircase;

    this.onFloorBuilt(this.level);
    return player;
  }

  /**
   * Requests the next floor. The rebuild is deferred to `update()` because the
   * request arrives from inside the player's own update, and destroying an
   * entity partway through its update leaves the loop working on a torn-down
   * object.
   */
  public descend(): void {
    this.descendRequested = true;
  }

  /** True while a descent is waiting to be applied. */
  public get isDescendPending(): boolean {
    return this.descendRequested;
  }

  /**
   * Applies a pending descent. Call once per frame, after entities have been
   * updated and are no longer mid-flight.
   */
  public update(): void {
    if (!this.descendRequested) return;

    this.descendRequested = false;
    this.depth++;
    this.level.regenerate();
    this.build();
  }

  /** Restarts the run from a known seed. Used by the audit toolkit. */
  public restartFromSeed(seed: number): void {
    this.depth = 1;
    this.level.reseed(seed);
    this.build();
  }

  /** Moves the player onto the staircase, for hands-on verification. */
  public teleportToStaircase(): boolean {
    if (!this.player || !this.staircase) return false;

    this.player.x = this.staircase.x;
    this.player.y = this.staircase.y;
    this.player.syncView();
    return true;
  }
}
