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
import { Staircase } from './modules/Staircase';

// Define the audit interface for the global window object
declare global {
  interface Window {
    audit: any; // Keep 'any' or strictly define the interface. Using 'any' as it seems there are multiple dynamically added properties.
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

      // Spawn staircase far away
      let staircaseX = 0;
      let staircaseY = 0;
      let maxDist = 0;

      for (let y = 0; y < level.grid.height; y++) {
        for (let x = 0; x < level.grid.width; x++) {
          if (level.grid.get(x, y) === TileType.FLOOR) {
            const worldX = x * level.tileSize + level.tileSize / 2;
            const worldY = y * level.tileSize + level.tileSize / 2;
            const dx = worldX - centerX;
            const dy = worldY - centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > maxDist) {
              maxDist = dist;
              staircaseX = worldX;
              staircaseY = worldY;
            }
          }
        }
      }

      const staircase = new Staircase('staircase-1', staircaseX, staircaseY);
      entityManager.addEntity(staircase);
      player.setStaircase(staircase);

      player.setInteractionCallback(() => {
        console.log('Staircase interacted! Regenerating level...');
        level.regenerate();

        // Find new positions for player and staircase
        const newCenterX = Math.floor(level.grid.width / 2) * level.tileSize + level.tileSize / 2;
        const newCenterY = Math.floor(level.grid.height / 2) * level.tileSize + level.tileSize / 2;

        player.x = newCenterX;
        player.y = newCenterY;
        player.sprite.x = newCenterX;
        player.sprite.y = newCenterY;

        let newStaircaseX = 0;
        let newStaircaseY = 0;
        let newMaxDist = 0;

        for (let y = 0; y < level.grid.height; y++) {
          for (let x = 0; x < level.grid.width; x++) {
            if (level.grid.get(x, y) === TileType.FLOOR) {
              const worldX = x * level.tileSize + level.tileSize / 2;
              const worldY = y * level.tileSize + level.tileSize / 2;
              const dx = worldX - newCenterX;
              const dy = worldY - newCenterY;
              const dist = Math.sqrt(dx * dx + dy * dy);

              if (dist > newMaxDist) {
                newMaxDist = dist;
                newStaircaseX = worldX;
                newStaircaseY = worldY;
              }
            }
          }
        }

        staircase.x = newStaircaseX;
        staircase.y = newStaircaseY;
        staircase.sprite.x = newStaircaseX;
        staircase.sprite.y = newStaircaseY;

        console.log(`Level regenerated. Player at (${newCenterX}, ${newCenterY}), Staircase at (${newStaircaseX}, ${newStaircaseY}).`);
      });

      console.log(`Player spawned via EntityManager at (${centerX}, ${centerY}). Camera tracking engaged. Use WASD to move.`);
    },
    teleportToStairs: () => {
      const playerEntity = entityManager.getEntities().find(e => e.id === 'player-1');
      const staircaseEntity = entityManager.getEntities().find(e => e.id === 'staircase-1');

      if (playerEntity && staircaseEntity) {
        playerEntity.x = staircaseEntity.x;
        playerEntity.y = staircaseEntity.y;
        playerEntity.sprite.x = staircaseEntity.x;
        playerEntity.sprite.y = staircaseEntity.y;
        console.log(`Player teleported to stairs at (${staircaseEntity.x}, ${staircaseEntity.y}). Press 'e' to interact.`);
      } else {
        console.error('Player or Staircase not found in EntityManager. Call window.audit.spawnPlayer() first.');
      }
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
