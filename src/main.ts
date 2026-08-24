import { Renderer } from './engine/Renderer';
import { GameLoop } from './engine/GameLoop';
import { InputManager } from './engine/InputManager';
import { EntityManager } from './engine/EntityManager';
import { TestSquare } from './modules/TestSquare';
import { Player } from './modules/Player';
import { Camera } from './engine/Camera';
import { Graphics } from 'pixi.js';

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

  // Background grid to visualize camera movement
  const grid = new Graphics();
  for (let x = -2000; x <= 2000; x += 100) {
    grid.moveTo(x, -2000);
    grid.lineTo(x, 2000);
  }
  for (let y = -2000; y <= 2000; y += 100) {
    grid.moveTo(-2000, y);
    grid.lineTo(2000, y);
  }
  grid.stroke({ width: 1, color: 0x333333 });
  renderer.app.stage.addChildAt(grid, 0); // add to the very back

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
      const player = new Player('player-1', 400, 300, inputManager);
      entityManager.addEntity(player);
      camera.setTarget(player);
      console.log('Player spawned via EntityManager at (400, 300). Camera tracking engaged. Use WASD to move.');
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
    }
  };

  console.log('Dungeon Crawler Engine initialized.');
}

// Global reset of default browser margins for full screen canvas
document.body.style.margin = '0';
document.body.style.overflow = 'hidden';

bootstrap().catch(console.error);
