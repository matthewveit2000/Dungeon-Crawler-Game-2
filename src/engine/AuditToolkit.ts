import { Renderer } from './Renderer';
import { GameLoop } from './GameLoop';
import { InputManager } from './InputManager';
import { EntityManager } from './EntityManager';
import { Camera } from './Camera';
import { MapOverlay } from './MapOverlay';
import { InventoryOverlay } from './InventoryOverlay';
import { ProgressionOverlay } from './ProgressionOverlay';
import { Level } from '../modules/Level';
import { FloorManager } from '../modules/FloorManager';
import { TestSquare } from '../modules/TestSquare';
import { Timer } from '../modules/Timer';
import { ItemGenerator } from '../modules/ItemGenerator';
import { Enemy } from '../modules/Enemy';
import world from '../packs/World.json';

export interface AuditToolkit {
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
  generateAffixedItem(rarity?: string): string;
  spawnLootDrop(x?: number, y?: number): string;
  openInventory(): string;
  equipInventoryItem(index?: number): string;
  teleportToCity(): string;
  testCityDeAggro(): string;
  addGold(amount?: number): string;
  buyVendorItem(id?: string): string;
  sellInventoryItem(index?: number): string;
  teleportToBoss(): string;
  triggerBossEncounter(): string;
  killBoss(): string;
  killTarget(): string;
  grantXP(amount?: number): string;
  getLevelStats(): Record<string, number>;
  getPointPools(): Record<string, any>;
  allocatePoint(type?: string, name?: string): string;
  openProgressionMenu(): string;
  spendAttributePoint(name?: string): string;
  spendSkillPoint(name?: string): string;
  [key: string]: any;
}

declare global {
  interface Window {
    audit: AuditToolkit;
  }
}

export interface AuditContext {
  renderer: Renderer;
  gameLoop: GameLoop;
  inputManager: InputManager;
  entityManager: EntityManager;
  camera: Camera;
  overlay: MapOverlay;
  inventoryOverlay: InventoryOverlay;
  progressionOverlay?: ProgressionOverlay;
  timer: Timer;
  level: Level;
  floors: FloorManager;
  itemGen: ItemGenerator;
}

export function registerAuditToolkit(ctx: AuditContext): AuditToolkit {
  const audit: AuditToolkit = {
    logInputs: false,

    getFPS: () => ctx.gameLoop.getFPS(),
    getRendererDimensions: () => ({
      width: ctx.renderer.screenWidth,
      height: ctx.renderer.screenHeight,
    }),

    spawnTestSquare: () => {
      const p = ctx.floors.getPlayer();
      const x = (p?.x ?? 0) + world.tileSize * 2;
      ctx.entityManager.addEntity(new TestSquare(`square-${Date.now()}`, x, p?.y ?? 0));
      return `Spinning square spawned near player at (${Math.round(x)}, ${Math.round(p?.y ?? 0)}).`;
    },
    spawnPlayer: () => {
      ctx.floors.build();
      return `Floor rebuilt. Player at (${Math.round(ctx.level.spawnPoint.x)}, ${Math.round(ctx.level.spawnPoint.y)}).`;
    },
    teleportToStairs: () => {
      if (!ctx.floors.teleportToStaircase()) return 'No player on floor. Run spawnPlayer() first.';
      const s = ctx.floors.getStaircase()!;
      return `Teleported to staircase at (${Math.round(s.x)}, ${Math.round(s.y)}). Press E to descend.`;
    },
    teleportToEnemy: (index = 0) => {
      const es = ctx.floors.getEnemies();
      const p = ctx.floors.getPlayer();
      if (!p || es.length === 0) return 'No enemies or player found.';
      const e = es[index % es.length];
      p.x = e.x;
      p.y = e.y;
      p.syncView();
      ctx.camera.setTarget(p);
      return `Teleported near ${e.enemyType} at (${Math.round(e.x)}, ${Math.round(e.y)}).`;
    },
    zoomOutMap: () => {
      return ctx.overlay.toggle(ctx.level.grid, ctx.renderer.screenWidth, ctx.renderer.screenHeight)
        ? 'Macro map shown. Run window.audit.zoomOutMap() again to hide it.'
        : 'Macro map hidden.';
    },
    getSeed: () => ctx.level.seed,
    setSeed: (seed: number) => {
      ctx.floors.restartFromSeed(seed);
      ctx.camera.setTarget(ctx.floors.getPlayer()!);
      return `Run restarted from seed ${seed}.`;
    },
    setTimer: (s: number) => {
      ctx.timer.setTime(s);
      return `Global timer set to ${s} seconds.`;
    },
    toggleMenu: () => {
      ctx.gameLoop.isMenuOpen = !ctx.gameLoop.isMenuOpen;
      return ctx.gameLoop.isMenuOpen
        ? 'Menu open. Simulation paused.'
        : 'Menu closed. Simulation resumed.';
    },
    getZoom: () => ctx.camera.getZoom(),
    setZoom: (z: number) => {
      ctx.camera.setZoom(z);
      return `Camera zoom set to ${z}x.`;
    },
    damagePlayer: (amount: number) => {
      const p = ctx.floors.getPlayer();
      if (!p) return 'No player on floor.';
      const taken = p.takeDamage(amount);
      return `Dealt ${taken} damage. Player HP: ${p.health}/${p.maxHealth}.`;
    },
    playerAttack: (tx?: number, ty?: number) => {
      const p = ctx.floors.getPlayer();
      if (!p) return 'No player on floor.';
      const res = p.attackAt(tx ?? p.x + 30, ty ?? p.y);
      return `Attacked with ${p.weapon.name} (${res.type}). Hits: ${res.hits ?? (res.projectile ? 1 : 0)}.`;
    },
    equipWeapon: (id: string) => {
      const p = ctx.floors.getPlayer();
      if (!p) return 'No player on floor.';
      p.equipWeapon(id as any);
      return `Equipped ${p.weapon.name} (${p.weapon.type}).`;
    },
    spawnLoot: (lvl = ctx.floors.currentDepth, rarity?: string) => {
      const item = ctx.itemGen.generateItem({ level: lvl, rarity: rarity as any });
      console.log(item.toStatBlock());
      return `Spawned ${item.name} (${item.rarity.toUpperCase()}, Lv. ${item.level}).`;
    },
    generateAffixedItem: (rarity = 'legendary') => {
      const item = ctx.itemGen.generateItem({ rarity: rarity as any });
      console.log(item.toStatBlock());
      return `Generated ${item.name} with ${item.affixes.length} affixes.`;
    },
    spawnLootDrop: (x?: number, y?: number) => {
      const p = ctx.floors.getPlayer();
      const dropX = x ?? (p ? p.x + 20 : 0);
      const dropY = y ?? (p ? p.y : 0);
      const drop = ctx.floors.spawnLootDrop(dropX, dropY);
      return `Spawned ${drop.item.name} on ground at (${Math.round(dropX)}, ${Math.round(dropY)}).`;
    },
    openInventory: () => {
      const p = ctx.floors.getPlayer();
      if (!p) return 'No player on floor.';
      const shown = ctx.inventoryOverlay.toggle(
        p.inventoryManager,
        ctx.renderer.screenWidth,
        ctx.renderer.screenHeight,
      );
      ctx.gameLoop.isMenuOpen = shown;
      return shown
        ? 'Inventory opened. Simulation paused.'
        : 'Inventory closed. Simulation resumed.';
    },
    equipInventoryItem: (index = 0) => {
      const p = ctx.floors.getPlayer();
      if (!p) return 'No player on floor.';
      const item = p.inventoryManager.items[index];
      if (!item) return `No item at inventory index ${index}.`;
      p.inventoryManager.equip(item);
      p.refreshEquippedStats();
      if (ctx.inventoryOverlay.isVisible) {
        ctx.inventoryOverlay.show(
          p.inventoryManager,
          ctx.renderer.screenWidth,
          ctx.renderer.screenHeight,
        );
      }
      return `Equipped ${item.name} into ${item.slot} slot.`;
    },
    teleportToCity: () => {
      const p = ctx.floors.getPlayer();
      if (!p || !ctx.level.cityBounds) return 'No player or city on floor.';
      const center = ctx.level.cityBounds.center;
      p.x = center.x;
      p.y = center.y;
      p.syncView();
      ctx.camera.setTarget(p);
      return `Teleported player to Sanctuary Haven (Safe Zone) at (${Math.round(center.x)}, ${Math.round(center.y)}).`;
    },
    testCityDeAggro: () => {
      const p = ctx.floors.getPlayer();
      if (!p || !ctx.level.cityBounds) return 'No player or city on floor.';
      const center = ctx.level.cityBounds.center;
      p.x = center.x;
      p.y = center.y;
      p.syncView();
      ctx.camera.setTarget(p);

      const enemy = new Enemy(`audit-deaggro-${Date.now()}`, 'goblin', center.x + 80, center.y, {
        level: ctx.level,
      });
      enemy.setTarget(p);
      ctx.entityManager.addEntity(enemy);
      enemy.update(0.1);
      return `Spawned enemy outside Sanctuary Haven. Player is at safe center (${Math.round(center.x)}, ${Math.round(center.y)}). Enemy state: ${enemy.state}.`;
    },
    addGold: (amount = 100) => {
      const p = ctx.floors.getPlayer();
      if (!p) return 'No player on floor.';
      p.gold += amount;
      return `Added ${amount} Gold to player. Current gold: ${p.gold}.`;
    },
    buyVendorItem: (id = 'potion_health') => {
      const p = ctx.floors.getPlayer();
      const vendor = ctx.floors.getVendor();
      if (!p || !vendor) return 'No player or vendor on floor.';
      const res = vendor.buy(p, id);
      return res.success
        ? `Purchased ${res.item?.name} for ${res.item?.cost} Gold. Remaining gold: ${p.gold}. Player HP: ${p.health}/${p.maxHealth}.`
        : `Purchase failed: ${res.reason}. Player gold: ${p.gold}.`;
    },
    sellInventoryItem: (index = 0) => {
      const p = ctx.floors.getPlayer();
      const vendor = ctx.floors.getVendor();
      if (!p || !vendor) return 'No player or vendor on floor.';
      const res = vendor.sell(p, index);
      return res.success
        ? `Sold item at index ${index} for ${res.goldEarned} Gold. Total gold: ${p.gold}.`
        : `Sell failed: no item at index ${index}.`;
    },
    teleportToBoss: () => {
      const p = ctx.floors.getPlayer();
      if (!p || !ctx.level.bossArenaBounds) return 'No player or boss arena on floor.';
      const doors = ctx.level.bossArenaBounds.entranceDoors;
      const doorTile = doors[0];
      const doorWorld = ctx.level.tileCenter(doorTile.x, doorTile.y);
      p.x = doorWorld.x;
      p.y = doorWorld.y;
      p.syncView();
      ctx.camera.setTarget(p);
      const boss = ctx.floors.getBoss();
      return `Teleported player to Boss Arena entrance at (${Math.round(doorWorld.x)}, ${Math.round(doorWorld.y)}). Boss state: ${boss?.state ?? 'None'}.`;
    },
    triggerBossEncounter: () => {
      const p = ctx.floors.getPlayer();
      if (!p || !ctx.level.bossArenaBounds) return 'No player or boss arena on floor.';
      const arenaCenter = ctx.level.bossArenaBounds.arena.center;
      const arenaWorld = ctx.level.tileCenter(arenaCenter.x, arenaCenter.y);
      p.x = arenaWorld.x;
      p.y = arenaWorld.y + 60;
      p.syncView();
      ctx.camera.setTarget(p);
      ctx.floors.update();
      const boss = ctx.floors.getBoss();
      return `Triggered Boss encounter! Player inside arena. Doors locked: ${ctx.level.isBossArenaLocked}. Boss state: ${boss?.state}.`;
    },
    killBoss: () => {
      const boss = ctx.floors.getBoss();
      if (!boss) return 'No boss on current floor.';
      boss.takeDamage(99999);
      ctx.floors.update();
      return `Defeated Boss! Treasure room unlocked: ${ctx.level.isTreasureRoomUnlocked}. High-tier loot spawned.`;
    },
    killTarget: () => {
      const boss = ctx.floors.getBoss();
      if (boss && boss.isAlive) {
        boss.takeDamage(99999);
        ctx.floors.update();
        return `Defeated Boss! Treasure room unlocked: ${ctx.level.isTreasureRoomUnlocked}. High-tier loot spawned.`;
      }
      const enemies = ctx.floors.getEnemies();
      if (enemies.length === 0) return 'No enemies on floor.';
      const enemy = enemies[0];
      enemy.takeDamage(99999);
      ctx.floors.update();
      return `Killed ${enemy.enemyType} (${enemy.id}).`;
    },
    grantXP: (amount = 100) => {
      const p = ctx.floors.getPlayer();
      if (!p) return 'No player on floor.';
      const res = p.addXP(amount);
      return `Granted ${amount} XP. Level: ${p.level}, Current XP: ${p.xp}/${p.xpToNextLevel}. Leveled up: ${res.leveledUp}.`;
    },
    getLevelStats: () => {
      const p = ctx.floors.getPlayer();
      if (!p) return { level: 0, currentXP: 0, xpToNextLevel: 0 };
      return {
        level: p.level,
        currentXP: p.xp,
        xpToNextLevel: p.xpToNextLevel,
      };
    },
    getPointPools: () => {
      const p = ctx.floors.getPlayer();
      if (!p) return { attributePoints: 0, skillPoints: 0, attributes: {}, skills: {} };
      return {
        attributePoints: p.attributePoints,
        skillPoints: p.skillPoints,
        attributes: p.progression.attributes,
        skills: p.progression.skills,
      };
    },
    allocatePoint: (type = 'attribute', name = 'vitality') => {
      const p = ctx.floors.getPlayer();
      if (!p) return 'No player on floor.';
      if (type === 'attribute') {
        const success = p.progression.allocateAttribute(name as any);
        if (success) p.refreshEquippedStats();
        return success
          ? `Allocated 1 Attribute Point to ${name}. Remaining attribute points: ${p.attributePoints}.`
          : `Failed to allocate Attribute Point to ${name} (insufficient points or invalid attribute).`;
      } else {
        const success = p.progression.allocateSkill(name as any);
        if (success) p.refreshEquippedStats();
        return success
          ? `Allocated 1 Skill Point to ${name}. Remaining skill points: ${p.skillPoints}.`
          : `Failed to allocate Skill Point to ${name} (insufficient points or max rank reached).`;
      }
    },
    openProgressionMenu: () => {
      if (!ctx.progressionOverlay) return 'No progression overlay available.';
      const shown = ctx.progressionOverlay.toggleVisibility();
      return `Progression menu visible: ${shown}.`;
    },
    spendAttributePoint: (name = 'vitality') => {
      if (!ctx.progressionOverlay) return 'No progression overlay available.';
      const success = ctx.progressionOverlay.spendAttribute(name as any);
      return success
        ? `Successfully allocated Attribute Point to ${name}.`
        : `Failed to allocate Attribute Point to ${name}.`;
    },
    spendSkillPoint: (name = 'stoneSkin') => {
      if (!ctx.progressionOverlay) return 'No progression overlay available.';
      const success = ctx.progressionOverlay.spendSkill(name as any);
      return success
        ? `Successfully allocated Skill Point to ${name}.`
        : `Failed to allocate Skill Point to ${name}.`;
    },
    getFloorStats: () => ctx.floors.getFloorStats(),
  };

  window.audit = audit;
  return audit;
}
