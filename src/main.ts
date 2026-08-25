import { Renderer } from './engine/Renderer';
import { GameLoop } from './engine/GameLoop';
import { InputManager } from './engine/InputManager';
import { EntityManager } from './engine/EntityManager';
import { Camera } from './engine/Camera';
import { TileRenderer } from './engine/TileRenderer';
import { MapOverlay } from './engine/MapOverlay';
import { parseColor } from './engine/View';
import { Level } from './modules/Level';
import { TileType } from './modules/MapGenerator';
import { FloorManager } from './modules/FloorManager';
import { TestSquare } from './modules/TestSquare';
import { Timer } from './modules/Timer';
import { TimerOverlay } from './engine/TimerOverlay';
import world from './packs/World.json';

/** Console helpers the PM uses to verify each phase by hand. */
interface AuditToolkit {
  logInputs: boolean;
  getFPS(): number;
  getRendererDimensions(): { width: number; height: number };
  spawnTestSquare(): string;
  spawnPlayer(): string;
  teleportToStairs(): string;
  zoomOutMap(): string;
  getSeed(): number;
  setSeed(seed: number): string;
  getFloorStats(): Record<string, number>;
  setTimer(seconds: number): string;
  toggleMenu(): string;
}

declare global {
  interface Window {
    audit: AuditToolkit;
  }
}

// Tile values map to palette entries by index; see TileType.
const PALETTE: number[] = [];
PALETTE[TileType.WALL] = parseColor(world.palette.wall);
PALETTE[TileType.FLOOR] = parseColor(world.palette.floor);

async function bootstrap(): Promise<void> {
  console.log('Dungeon Crawler Engine initializing...');

  const appContainer = document.getElementById('app');
  if (!appContainer) {
    throw new Error('Could not find #app container in DOM.');
  }

  const renderer = new Renderer({ background: parseColor(world.background) });
  await renderer.init(appContainer);

  const inputManager = new InputManager();
  const gameLoop = new GameLoop();
  const entityManager = new EntityManager(renderer.world);
  const camera = new Camera(renderer.world, renderer.screenWidth, renderer.screenHeight);

  // Walls are the stage background colour, so skipping them removes most of the
  // geometry without changing what the player sees.
  const tileRenderer = new TileRenderer({
    tileSize: world.tileSize,
    palette: PALETTE,
    skip: [TileType.WALL],
  });
  renderer.world.addChildAt(tileRenderer.view, 0);

  const overlay = new MapOverlay({
    tileSize: world.overlay.tileSize,
    palette: PALETTE,
    backdrop: parseColor(world.overlay.backdrop),
    backdropAlpha: world.overlay.backdropAlpha,
    padding: world.overlay.padding,
  });
  renderer.ui.addChild(overlay.view);

  const timer = new Timer();
  const timerOverlay = new TimerOverlay({ screenWidth: renderer.screenWidth });
  renderer.ui.addChild(timerOverlay.view);

  const level = new Level();
  const floors = new FloorManager(level, entityManager, inputManager, (built) => {
    tileRenderer.render(built.grid);
    // Keep an open overlay in step with the floor it is describing.
    if (overlay.isVisible) {
      overlay.show(built.grid, renderer.screenWidth, renderer.screenHeight);
    }
  });

  // A playable floor exists the moment the page loads; no console required.
  camera.setTarget(floors.build());

  window.addEventListener('resize', () => {
    camera.resize(renderer.screenWidth, renderer.screenHeight);
    timerOverlay.resize(renderer.screenWidth);
    if (overlay.isVisible) {
      overlay.show(level.grid, renderer.screenWidth, renderer.screenHeight);
    }
  });

  gameLoop.start((dt) => {
    timer.update(dt);
    timerOverlay.updateTime(timer.toDisplayString());

    entityManager.update(dt);
    // Applied after entity updates, so a descent never tears down an entity
    // that is still mid-update.
    floors.update();
    camera.update();

    if (window.audit?.logInputs) {
      console.log('Input State:', inputManager.getState());
    }

    // Clears one-frame edge state; must run after everything that reads input.
    inputManager.endFrame();
  });

  window.audit = {
    logInputs: false,

    getFPS: () => gameLoop.getFPS(),

    getRendererDimensions: () => ({
      width: renderer.screenWidth,
      height: renderer.screenHeight,
    }),

    spawnTestSquare: () => {
      const player = floors.getPlayer();
      const x = (player?.x ?? 0) + world.tileSize * 2;
      const y = player?.y ?? 0;
      entityManager.addEntity(new TestSquare(`test-square-${Date.now()}`, x, y));
      return `Spinning red square spawned two tiles to the right of the player at (${Math.round(x)}, ${Math.round(y)}).`;
    },

    spawnPlayer: () => {
      camera.setTarget(floors.build());
      const spawn = level.spawnPoint;
      return `Floor rebuilt. Player at (${Math.round(spawn.x)}, ${Math.round(spawn.y)}). Use WASD or the arrow keys to move.`;
    },

    teleportToStairs: () => {
      if (!floors.teleportToStaircase()) {
        return 'No player on this floor. Run window.audit.spawnPlayer() first.';
      }
      const stairs = floors.getStaircase();
      return `Teleported to the staircase at (${Math.round(stairs!.x)}, ${Math.round(stairs!.y)}). Press E to descend.`;
    },

    zoomOutMap: () => {
      const shown = overlay.toggle(level.grid, renderer.screenWidth, renderer.screenHeight);
      return shown
        ? 'Macro map shown. Run window.audit.zoomOutMap() again to hide it.'
        : 'Macro map hidden.';
    },

    getSeed: () => level.seed,

    setSeed: (seed: number) => {
      floors.restartFromSeed(seed);
      camera.setTarget(floors.getPlayer()!);
      return `Run restarted from seed ${seed}. The same seed always builds the same floor.`;
    },

    setTimer: (seconds: number) => {
      timer.setTime(seconds);
      return `Global timer set to ${seconds} seconds.`;
    },

    toggleMenu: () => {
      gameLoop.isMenuOpen = !gameLoop.isMenuOpen;
      return gameLoop.isMenuOpen ? 'Menu open. Simulation paused.' : 'Menu closed. Simulation resumed.';
    },

    getFloorStats: () => {
      let floorTiles = 0;
      for (let y = 0; y < level.grid.height; y++) {
        for (let x = 0; x < level.grid.width; x++) {
          if (level.grid.get(x, y) === TileType.FLOOR) floorTiles++;
        }
      }

      const spawn = level.spawnPoint;
      const exit = level.findFarthestFloor(spawn.x, spawn.y);
      const distance = Math.hypot(exit.x - spawn.x, exit.y - spawn.y);

      return {
        depth: floors.currentDepth,
        seed: level.seed,
        floorTiles,
        gridTiles: level.grid.width * level.grid.height,
        worldWidthPx: level.grid.width * level.tileSize,
        worldHeightPx: level.grid.height * level.tileSize,
        stairsDistancePx: Math.round(distance),
        stairsSecondsAway: Math.round(distance / (floors.getPlayer()?.speed ?? 1)),
      };
    },
  };

  console.log(
    'Dungeon Crawler Engine initialized. Use WASD or arrow keys to move, E to use the staircase.',
  );
}

// Full-bleed canvas.
document.body.style.margin = '0';
document.body.style.overflow = 'hidden';

bootstrap().catch(console.error);
