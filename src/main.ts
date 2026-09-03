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
import { AssetLoader } from './engine/AssetLoader';
import { parseColor } from './engine/View';
import { Level } from './modules/Level';
import { FloorManager } from './modules/FloorManager';
import { TestSquare } from './modules/TestSquare';
import { Timer } from './modules/Timer';
import { ItemGenerator } from './modules/ItemGenerator';
import { Rng } from './engine/Rng';
import world from './packs/World.json';
import art from './packs/Art.json';

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
  getZoom(): number;
  setZoom(zoom: number): string;
  damagePlayer(amount: number): string;
  teleportToEnemy(index?: number): string;
  playerAttack(targetX?: number, targetY?: number): string;
  equipWeapon(id: string): string;
  spawnLoot(level?: number, rarity?: string): string;
}

declare global {
  interface Window {
    audit: AuditToolkit;
  }
}

// Tile values map to palette entries by index; see TileType.
const PALETTE = [parseColor(world.palette.wall), parseColor(world.palette.floor)];

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
  renderer.ui.addChild(timerOverlay.view, healthOverlay.view, gameOverOverlay.view);

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
  floors.build();

  window.addEventListener('resize', () => {
    camera.resize(renderer.screenWidth, renderer.screenHeight);
    timerOverlay.resize(renderer.screenWidth);
    gameOverOverlay.resize(renderer.screenWidth, renderer.screenHeight);
    if (overlay.isVisible) overlay.show(level.grid, renderer.screenWidth, renderer.screenHeight);
  });

  timer.setOnZeroCallback(() => floors.getPlayer()?.die());

  gameLoop.start((dt) => {
    timer.update(dt);
    timerOverlay.updateTime(timer.toDisplayString());
    entityManager.update(dt);
    floors.update();
    camera.update();
    if (window.audit?.logInputs) console.log('Input State:', inputManager.getState());
    inputManager.endFrame();
  });

  window.audit = {
    logInputs: false,

    getFPS: () => gameLoop.getFPS(),
    getRendererDimensions: () => ({ width: renderer.screenWidth, height: renderer.screenHeight }),

    spawnTestSquare: () => {
      const p = floors.getPlayer();
      const x = (p?.x ?? 0) + world.tileSize * 2;
      entityManager.addEntity(new TestSquare(`square-${Date.now()}`, x, p?.y ?? 0));
      return `Spinning square spawned near player at (${Math.round(x)}, ${Math.round(p?.y ?? 0)}).`;
    },
    spawnPlayer: () => {
      floors.build();
      return `Floor rebuilt. Player at (${Math.round(level.spawnPoint.x)}, ${Math.round(level.spawnPoint.y)}).`;
    },
    teleportToStairs: () => {
      if (!floors.teleportToStaircase()) return 'No player on floor. Run spawnPlayer() first.';
      const s = floors.getStaircase()!;
      return `Teleported to staircase at (${Math.round(s.x)}, ${Math.round(s.y)}). Press E to descend.`;
    },
    teleportToEnemy: (index = 0) => {
      const es = floors.getEnemies();
      const p = floors.getPlayer();
      if (!p || es.length === 0) return 'No enemies or player found.';
      const e = es[index % es.length];
      p.x = e.x;
      p.y = e.y;
      p.syncView();
      camera.setTarget(p);
      return `Teleported near ${e.enemyType} at (${Math.round(e.x)}, ${Math.round(e.y)}).`;
    },
    zoomOutMap: () => {
      return overlay.toggle(level.grid, renderer.screenWidth, renderer.screenHeight)
        ? 'Macro map shown. Run window.audit.zoomOutMap() again to hide it.'
        : 'Macro map hidden.';
    },
    getSeed: () => level.seed,
    setSeed: (seed: number) => {
      floors.restartFromSeed(seed);
      camera.setTarget(floors.getPlayer()!);
      return `Run restarted from seed ${seed}.`;
    },
    setTimer: (s: number) => {
      timer.setTime(s);
      return `Global timer set to ${s} seconds.`;
    },
    toggleMenu: () => {
      gameLoop.isMenuOpen = !gameLoop.isMenuOpen;
      return gameLoop.isMenuOpen
        ? 'Menu open. Simulation paused.'
        : 'Menu closed. Simulation resumed.';
    },
    getZoom: () => camera.getZoom(),
    setZoom: (z: number) => {
      camera.setZoom(z);
      return `Camera zoom set to ${z}x.`;
    },
    damagePlayer: (amount: number) => {
      const p = floors.getPlayer();
      if (!p) return 'No player on floor.';
      const taken = p.takeDamage(amount);
      return `Dealt ${taken} damage. Player HP: ${p.health}/${p.maxHealth}.`;
    },
    playerAttack: (tx?: number, ty?: number) => {
      const p = floors.getPlayer();
      if (!p) return 'No player on floor.';
      const res = p.attackAt(tx ?? p.x + 30, ty ?? p.y);
      return `Attacked with ${p.weapon.name} (${res.type}). Hits: ${res.hits ?? (res.projectile ? 1 : 0)}.`;
    },
    equipWeapon: (id: string) => {
      const p = floors.getPlayer();
      if (!p) return 'No player on floor.';
      p.equipWeapon(id as any);
      return `Equipped ${p.weapon.name} (${p.weapon.type}).`;
    },
    spawnLoot: (lvl = floors.currentDepth, rarity?: string) => {
      const item = itemGen.generateItem({ level: lvl, rarity: rarity as any });
      console.log(item.toStatBlock());
      return `Spawned ${item.name} (${item.rarity.toUpperCase()}, Lv. ${item.level}).`;
    },
    getFloorStats: () => floors.getFloorStats(),
  };

  console.log(
    'Dungeon Crawler initialized. WASD to move, Space/Click to attack, Q to switch weapon, E for stairs.',
  );
}

document.body.style.margin = '0';
document.body.style.overflow = 'hidden';
bootstrap().catch(console.error);
