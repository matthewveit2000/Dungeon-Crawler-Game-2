# Milestone: EPIC 5 / Phase 21: Standard Enemy Definitions & Spawning

## 1. Executive Summary

Phase 21 expands **EPIC 5: Combat Systems & Entity AI** by implementing data-driven monster definitions and dynamic seeded enemy spawning across generated dungeon floors.

- **Tier 3 Enemy Data Pack ([`src/packs/Enemies.json`](file:///c:/Users/matth/dev/Dungeon%20Crawler%20Game%202/Dungeon-Crawler-Game-2/src/packs/Enemies.json)):** Declared standard dungeon monsters (Goblin, Skeleton, and Giant Rat) with individual health, speed, damage, and collision specifications, alongside floor density and distribution weights.
- **Authentic 32x32 DCSS Enemy Sprites:** Extracted and deployed CC0 1.0 Universal monster art for Goblins, Skeletons, and Giant Rats from Dungeon Crawl Stone Soup, documented in [`CREDITS.md`](file:///c:/Users/matth/dev/Dungeon%20Crawler%20Game%202/Dungeon-Crawler-Game-2/CREDITS.md).
- **Dynamic Seeded Spawner ([`src/modules/EnemySpawner.ts`](file:///c:/Users/matth/dev/Dungeon%20Crawler%20Game%202/Dungeon-Crawler-Game-2/src/modules/EnemySpawner.ts)):** Distributes enemies across walkable floor tiles using seeded pseudo-random distribution, respecting minimum distance buffers from the player spawn.
- **Seamless Floor Lifecycle:** Spawning is managed automatically by [`FloorManager`](file:///c:/Users/matth/dev/Dungeon%20Crawler%20Game%202/Dungeon-Crawler-Game-2/src/modules/FloorManager.ts). Entities are wiped cleanly on floor descent with zero display object accumulation.

## 2. Technical Decisions & Architecture

- **Enemy Hierarchy (`Enemy.ts` inherits from `Entity`):**
  - Enemies share the unified combat contract (`health`, `maxHealth`, `takeDamage()`, `isAlive`, `die()`) developed in Phase 20.
  - Implemented in Tier 2 (`src/modules/Enemy.ts`) without importing `pixi.js`, strictly preserving architectural boundaries.
- **Seeded Determinism (`EnemySpawner.ts`):**
  - Spawning uses `Rng.nextInt()` seeded from the floor generator. Identical seeds produce the exact same count, types, and coordinates of enemies.
  - Guarantees that enemies spawn only on `TileType.FLOOR` tiles and never within `minDistanceFromPlayerTiles` (default 4 tiles) of the player's entrance.
- **Audit Toolkit Integration:**
  - Added `window.audit.teleportToEnemy(index)` to immediately navigate to and inspect spawned monsters.
  - Updated `window.audit.getFloorStats()` to report total enemy count on the floor.

## 3. Lessons Learned

- **Decoupling Content from Code:** Defining monster stats, art references, and density rules in `Enemies.json` allows game balance and content adjustments without altering TypeScript game engine code.
- **Visual Verification Before Completion:** Capturing in-game screenshots with `teleportToEnemy(0)` verified that goblin sprites appear sharply rendered at 10x integer zoom alongside the player.

## 4. Effortless Audit Toolkit

**Audit Steps:**

1. Open the development server:
   👉 **[http://localhost:5173/](http://localhost:5173/)**
2. **Enemy Inspection Audit:**
   - Open Developer Tools console (F12) and run:
     ```javascript
     window.audit.teleportToEnemy(0);
     ```
   - Notice the player is teleported right next to a spawned monster (e.g. Goblin, Skeleton, or Giant Rat).
   - Observe the monster's crisp 32x32 pixel art rendered at 10x zoom.
3. **Floor Stats Audit:**
   - In console, run:
     ```javascript
     window.audit.getFloorStats();
     ```
   - Check the `enemies` field (e.g. `enemies: 5`, bounded between 3 and 8 per `Enemies.json`).
4. **Floor Descent Cleanliness Audit:**
   - Run `window.audit.teleportToStairs()` and press **E** to descend.
   - Run `window.audit.getFloorStats()` again: verify new enemies have spawned on the new floor and all previous entities were wiped.
