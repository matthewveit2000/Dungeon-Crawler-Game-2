import { Renderer } from './engine/Renderer';
import { GameLoop } from './engine/GameLoop';
import { InputManager } from './engine/InputManager';
import { EntityManager } from './engine/EntityManager';
import { Camera } from './engine/Camera';
import { TileRenderer } from './engine/TileRenderer';
import { MapOverlay } from './engine/MapOverlay';
import { TimerOverlay } from './engine/TimerOverlay';
import { GameOverOverlay } from './engine/GameOverOverlay';
import { HealthOverlay } from './engine/HealthOverlay';
import { InventoryOverlay } from './engine/InventoryOverlay';
import { ProgressionOverlay } from './engine/ProgressionOverlay';
import { AssetLoader } from './engine/AssetLoader';
import { registerAuditToolkit } from './engine/AuditToolkit';
import { parseColor } from './engine/View';
import { Level } from './modules/Level';
import { FloorManager } from './modules/FloorManager';
import { Timer } from './modules/Timer';
import { ItemGenerator } from './modules/ItemGenerator';
import { Rng } from './engine/Rng';
import world from './packs/World.json';
import art from './packs/Art.json';
import prefabs from './packs/Prefabs.json';

// Tile values map to palette entries by index; see TileType.
const PALETTE = [
  parseColor(world.palette.wall),
  parseColor(world.palette.floor),
  parseColor(prefabs.city.color),
];

async function bootstrap(): Promise<void> {
  console.log('Dungeon Crawler Engine initializing...');

  const appContainer = document.getElementById('app');
  if (!appContainer) {
    throw new Error('Could not find #app container in DOM.');
  }

  const renderer = new Renderer({ background: parseColor(world.background) });
  await renderer.init(appContainer);
  await AssetLoader.loadArtPack(art, world.tileSize);

  const inputManager = new InputManager();
  const gameLoop = new GameLoop();
  const entityManager = new EntityManager(renderer.world);
  const camera = new Camera(
    renderer.world,
    renderer.screenWidth,
    renderer.screenHeight,
    world.defaultZoom,
  );
  const tileSprites = [world.sprites?.wall, world.sprites?.floor];
  const tileRenderer = new TileRenderer({
    tileSize: world.tileSize,
    palette: PALETTE,
    sprites: tileSprites,
  });
  renderer.world.addChildAt(tileRenderer.view, 0);

  const overlay = new MapOverlay({
    ...world.overlay,
    palette: PALETTE,
    backdrop: parseColor(world.overlay.backdrop),
  });
  renderer.ui.addChild(overlay.view);

  const timer = new Timer();
  const timerOverlay = new TimerOverlay({ screenWidth: renderer.screenWidth });
  const healthOverlay = new HealthOverlay({ initialHealth: 100, maxHealth: 100 });
  const gameOverOverlay = new GameOverOverlay({
    screenWidth: renderer.screenWidth,
    screenHeight: renderer.screenHeight,
  });
  const inventoryOverlay = new InventoryOverlay({
    screenWidth: renderer.screenWidth,
    screenHeight: renderer.screenHeight,
  });
  renderer.ui.addChild(
    timerOverlay.view,
    healthOverlay.view,
    gameOverOverlay.view,
    inventoryOverlay.view,
  );

  const level = new Level();
  const itemGen = new ItemGenerator(new Rng(level.seed));
  const floors = new FloorManager(level, entityManager, inputManager, (built) => {
    tileRenderer.render(built.grid);
    const p = floors.getPlayer();
    if (p) {
      camera.setTarget(p);
      p.setScreenToWorld((x, y) => camera.screenToWorld(x, y));
      healthOverlay.updateHealth(p.health, p.maxHealth);
      p.setOnDamagedCallback(() => healthOverlay.updateHealth(p.health, p.maxHealth));
      p.setOnDeathCallback(() => (gameLoop.stop(), gameOverOverlay.show()));
    }
    if (overlay.isVisible) overlay.show(built.grid, renderer.screenWidth, renderer.screenHeight);
  });

  // A playable floor exists the moment the page loads; no console required.
  const player = floors.build();

  const progressionOverlay = new ProgressionOverlay(player, {
    screenWidth: renderer.screenWidth,
    screenHeight: renderer.screenHeight,
  });
  renderer.app.stage.addChild(progressionOverlay.view);

  window.addEventListener('resize', () => {
    camera.resize(renderer.screenWidth, renderer.screenHeight);
    timerOverlay.resize(renderer.screenWidth);
    gameOverOverlay.resize(renderer.screenWidth, renderer.screenHeight);
    inventoryOverlay.resize(renderer.screenWidth, renderer.screenHeight);
    progressionOverlay.resize(renderer.screenWidth, renderer.screenHeight);
    if (overlay.isVisible) overlay.show(level.grid, renderer.screenWidth, renderer.screenHeight);
  });

  timer.setOnZeroCallback(() => floors.getPlayer()?.die());

  gameLoop.start((dt) => {
    const inputState = inputManager.getState();
    if (inputState.justPressed['KeyI'] || inputState.justPressed['i']) {
      const p = floors.getPlayer();
      if (p) {
        const shown = inventoryOverlay.toggle(
          p.inventoryManager,
          renderer.screenWidth,
          renderer.screenHeight,
        );
        gameLoop.isMenuOpen = shown || progressionOverlay.isVisible;
      }
    }

    if (inputState.justPressed['KeyP'] || inputState.justPressed['p']) {
      const shown = progressionOverlay.toggleVisibility();
      gameLoop.isMenuOpen = shown || inventoryOverlay.isVisible;
    }

    timer.update(dt);
    timerOverlay.updateTime(timer.toDisplayString());
    entityManager.update(dt);
    floors.update();
    camera.update();
    if (window.audit?.logInputs) console.log('Input State:', inputState);
    inputManager.endFrame();
  });

  registerAuditToolkit({
    renderer,
    gameLoop,
    inputManager,
    entityManager,
    camera,
    overlay,
    inventoryOverlay,
    progressionOverlay,
    timer,
    level,
    floors,
    itemGen,
  });

  console.log(
    'Dungeon Crawler initialized. WASD to move, Space/Click to attack, Q to switch weapon, E for stairs, I for inventory, P for progression.',
  );
}

document.body.style.margin = '0';
document.body.style.overflow = 'hidden';
bootstrap().catch(console.error);
