import { Renderer } from './engine/Renderer';
import { GameLoop } from './engine/GameLoop';
import { InputManager } from './engine/InputManager';
import { EntityManager } from './engine/EntityManager';
import { TestSquare } from './modules/TestSquare';
import { Player } from './modules/Player';
import { Camera } from './engine/Camera';
import { Graphics } from 'pixi.js';
import { MapGrid } from './modules/MapGrid';
import { MapGenerator, TileType } from './modules/MapGenerator';
import { Level } from './modules/Level';

// Define the audit interface for the global window object
declare global {
  interface Window {
    audit: any;
  }
}

async function bootstrap() {
  console.log('Dungeon Crawler Engine initializing...');

  const appContainer = document.getElementById('app');
  if (!appContainer) {
    throw new Error('Could not find #app container in DOM.');
  }

  const renderer = new Renderer();
  await renderer.init(appContainer);

  const gameLoop = new GameLoop();
  const inputManager = new InputManager();


  // Phase 5: Initialize EntityManager with the stage
  const entityManager = new EntityManager(renderer.app.stage);

  // Phase 7: Camera Tracking Logic
  const camera = new Camera(renderer.app.stage, renderer.app.renderer.width, renderer.app.renderer.height);

  // Phase 10: Tile Rendering
  const level = new Level(100, 100);
  renderer.app.stage.addChildAt(level.view, 0); // Add behind everything else

  window.addEventListener('resize', () => {
    camera.resize(renderer.app.renderer.width, renderer.app.renderer.height);
  });



  // Setup the game loop
  gameLoop.start((dt: number) => {
    // Phase 5: Update all active entities
    entityManager.update(dt);

    // Phase 7: Update Camera
    camera.update();


    // Entities and Kinematics will hook in here in the future
    if (window.audit && window.audit.logInputs) {
      console.log('Input State:', inputManager.getState());
    }
  });

  // Setup the Effortless Audit Toolkit
  window.audit = {
    logInputs: false,
    spawnTestSquare: () => {
      const square = new TestSquare('test-square-1', 200, 200);
      entityManager.addEntity(square);
      console.log('TestSquare spawned via EntityManager.');
    },

    spawnPlayer: () => {
      // Spawn player in the center of the level grid where it is guaranteed to be a floor
      const centerX = Math.floor(level.grid.width / 2) * level.tileSize + level.tileSize / 2;
      const centerY = Math.floor(level.grid.height / 2) * level.tileSize + level.tileSize / 2;

      const player = new Player('player-1', centerX, centerY, inputManager, level);
      entityManager.addEntity(player);
      camera.setTarget(player);
      console.log(`Player spawned via EntityManager at (${centerX}, ${centerY}). Camera tracking engaged. Use WASD to move.`);
    },

    getRendererDimensions: () => {
      if (renderer && renderer.app && renderer.app.renderer) {
        return {
          width: renderer.app.renderer.width,
          height: renderer.app.renderer.height
        };
      }
      return null;
    },
    getFPS: () => {
      return gameLoop.getFPS();
    },
    zoomOutMap: () => {
      const grid = new MapGrid<TileType>(200, 200, TileType.WALL);
      MapGenerator.generateRandomWalk(grid, 15000);

      const mapGraphics = new Graphics();
      const tileSize = 4; // 4x4 pixels per tile

      for (let y = 0; y < grid.height; y++) {
        for (let x = 0; x < grid.width; x++) {
          if (grid.get(x, y) === TileType.FLOOR) {
            mapGraphics.rect(x * tileSize, y * tileSize, tileSize, tileSize);
            mapGraphics.fill(0xaaaaaa); // Light gray for floor
          } else {
            mapGraphics.rect(x * tileSize, y * tileSize, tileSize, tileSize);
            mapGraphics.fill(0x333333); // Dark gray for wall
          }
        }
      }

      // Center the map graphic on the screen
      mapGraphics.x = (renderer.app.renderer.width - (200 * tileSize)) / 2;
      mapGraphics.y = (renderer.app.renderer.height - (200 * tileSize)) / 2;

      renderer.app.stage.addChild(mapGraphics);
      console.log('Macro-scale map generated and rendered to stage.');
    }
  };

  console.log('Dungeon Crawler Engine initialized.');
}

// Global reset of default browser margins for full screen canvas
document.body.style.margin = '0';
document.body.style.overflow = 'hidden';

bootstrap().catch(console.error);
