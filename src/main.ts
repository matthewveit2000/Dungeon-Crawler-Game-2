import { Renderer } from './engine/Renderer';
import { GameLoop } from './engine/GameLoop';
import { InputManager } from './engine/InputManager';
import { EntityManager } from './engine/EntityManager';
import { TestSquare } from './modules/TestSquare';

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

  // Setup the game loop
  gameLoop.start((dt: number) => {
    // Phase 5: Update all active entities
    entityManager.update(dt);

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
