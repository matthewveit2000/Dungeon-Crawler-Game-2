# Milestone: EPIC 5 / Phase 22: Enemy Aggro Radius & Pathfinding

## 1. Executive Summary

Phase 22 implements intelligent behavior for spawned dungeon monsters by adding a finite state machine (`IDLE` vs `AGGRO`), detection radii configured in Tier 3, and collision-aware pursuit movement.

- **State Machine Detection:** Enemies rest in `IDLE` until the player steps within their detection radius (`aggroRadius`), at which point they shift to `AGGRO` state.
- **Configurable Aggro Radii ([`src/packs/Enemies.json`](file:///c:/Users/matth/dev/Dungeon%20Crawler%20Game%202/Dungeon-Crawler-Game-2/src/packs/Enemies.json)):** Configured detection radii in Tier 3 per archetype (Goblin: 160px / 5 tiles; Skeleton: 192px / 6 tiles; Giant Rat: 128px / 4 tiles).
- **Collision-Aware Movement ([`src/modules/Movement.ts`](file:///c:/Users/matth/dev/Dungeon%20Crawler%20Game%202/Dungeon-Crawler-Game-2/src/modules/Movement.ts)):** Enemies navigate toward the player using `resolveMovement`, ensuring they slide smoothly along walls without clipping or tunnelling through solid dungeon geometry.
- **Proximity Settlement:** Enemies maintain melee contact proximity without overlapping the player's center or oscillating back and forth.

## 2. Technical Decisions & Architecture

- **Enemy AI State Machine ([`src/modules/Enemy.ts`](file:///c:/Users/matth/dev/Dungeon%20Crawler%20Game%202/Dungeon-Crawler-Game-2/src/modules/Enemy.ts)):**
  - Managed in Tier 2 without importing `pixi.js`, upholding architectural boundaries.
  - State shifts:
    - `IDLE`: Monster stands stationary or resets if the target is destroyed/dead.
    - `AGGRO`: Triggered when Euclidean distance to target drops below `aggroRadius`.
  - Movement is normalized so diagonal pursuit moves at the monster's configured speed without diagonal speed boosts.
- **Wall Navigation:**
  - Monster pursuit utilizes the existing `resolveMovement` bisection system. If an enemy collides with a dungeon wall, it slides along the open axis toward the player.
- **Floor Integration ([`src/modules/FloorManager.ts`](file:///c:/Users/matth/dev/Dungeon%20Crawler%20Game%202/Dungeon-Crawler-Game-2/src/modules/FloorManager.ts)):**
  - When the player descends or a floor is built, all newly spawned monsters are assigned the new player entity as their tracking target via `enemy.setTarget(player)`.

## 3. Lessons Learned

- **Reusing Robust Movement Logic:** Reusing `resolveMovement` for monsters guarantees that enemies follow the exact same physics and anti-tunnelling rules as the player, eliminating bugs where monsters could pass through corners or walls.

## 4. Effortless Audit Toolkit

**Audit Steps:**

1. Open the development server:
   👉 **[http://localhost:5173/](http://localhost:5173/)**
2. **Aggro & Pursuit Audit:**
   - Open Developer Tools console (F12) and run:
     ```javascript
     window.audit.teleportToEnemy(0);
     ```
   - Notice the player is teleported near a monster.
   - Walk slowly away from the monster using WASD: notice the monster immediately shifts into aggro and pursues you at its configured speed.
3. **Wall Collision Audit:**
   - Walk around a hallway corner while being pursued: verify that the monster follows your path and is blocked by walls rather than walking straight through them.
4. **Descent Target Retargeting Audit:**
   - Teleport to stairs (`window.audit.teleportToStairs()`) and press **E** to descend.
   - Run `window.audit.teleportToEnemy(0)` on the new floor: verify that the newly spawned monsters correctly track and pursue your new character on Floor 2.
