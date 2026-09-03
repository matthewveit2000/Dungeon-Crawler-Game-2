# Milestone: EPIC 5 / Phase 20: Health, Damage, & Stats Framework

## 1. Executive Summary

Phase 20 initiates **EPIC 5: Combat Systems & Entity AI** by implementing a unified health, damage, and stats framework across the entity hierarchy.

- **Unified Combat Contract:** Built into `Entity`, providing `health`, `maxHealth`, `takeDamage()`, `heal()`, and lifecycle event hooks (`onDamaged`, `onDeath`). Every living entity in the dungeon shares the identical damage calculation and death sequence.
- **Dynamic Health HUD:** Added `HealthOverlay` to Tier 1, displaying `HP: <current>/<max>` anchored at the top-left with immediate reactive updates when damage is sustained.
- **Camera Auto-Tracking on Descent:** Resolved camera desynchronization across floor descents where the player appeared to disappear. The floor build lifecycle now reliably centers the camera on the newly instantiated player upon descending to a new floor.
- **High-Visibility Presentation:** Set default zoom to `10` in `World.json` and enlarged the countdown timer (`fontSize: 96`), giving the player and UI prominent, arcade-style presentation.

## 2. Technical Decisions & Architecture

- **Stats Contract on `Entity` ([`src/engine/Entity.ts`](file:///c:/Users/matth/dev/Dungeon%20Crawler%20Game%202/Dungeon-Crawler-Game-2/src/engine/Entity.ts)):**
  - Rather than isolating combat logic to the player, `takeDamage` and `heal` reside directly on `Entity`. This guarantees that upcoming monsters in Phase 21 will immediately participate in the combat pipeline with zero duplicate code.
  - Health is strictly clamped: damage cannot reduce health below 0, healing cannot exceed `maxHealth`, and dropping to 0 automatically triggers `die()` and dispatches `onDeath`.
- **Decoupled HUD Updates:**
  - `HealthOverlay` in Tier 1 exposes `updateHealth(current, max)`. `main.ts` connects `player.setOnDamagedCallback` directly to the overlay, keeping the engine decoupled from game loop logic.
- **Camera Descent Synchronization ([`src/engine/Camera.ts`](file:///c:/Users/matth/dev/Dungeon%20Crawler%20Game%202/Dungeon-Crawler-Game-2/src/engine/Camera.ts), [`src/main.ts`](file:///c:/Users/matth/dev/Dungeon%20Crawler%20Game%202/Dungeon-Crawler-Game-2/src/main.ts)):**
  - Fixed an issue where the camera retained a reference to the previous floor's torn-down player. `FloorManager` callback now updates `camera.setTarget(player)` whenever a floor is constructed, and `setTarget` immediately calls `update()` to snap viewport coordinates to the new floor's spawn location.

## 3. Lessons Learned

- **Entity Lifecycles vs Viewport Targets:** When a floor resets or descents occur, all entities are wiped and recreated. Systems that reference active entities (such as camera targets and UI listeners) must be updated inside the floor creation lifecycle callback to prevent stale references.

## 4. Effortless Audit Toolkit

**Audit Steps:**

1. Open the live application:
   👉 **[http://localhost:5173/](http://localhost:5173/)**
2. **Visual & Scaling Audit:**
   - Notice the player character rendered with crisp detail at 10x default zoom.
   - Observe the enlarged countdown timer centered at the top (`fontSize: 96`).
   - Observe the new health counter at the top left: `HP: 100/100`.
3. **Health & Damage Audit:**
   - Open Developer Tools console (F12) and run:
     ```javascript
     window.audit.damagePlayer(25);
     ```
   - Observe console output: `Dealt 25 damage. Player HP: 75/100.`
   - Observe that the top-left HUD immediately updates to `HP: 75/100`.
4. **Death & Game Over Audit:**
   - In console, run:
     ```javascript
     window.audit.damagePlayer(80);
     ```
   - Health drops to 0, simulation stops, and the "GAME OVER" screen is displayed.
5. **Floor Descent Audit:**
   - Refresh the page and press **E** on the staircase (or run `window.audit.teleportToStairs()` and press **E**).
   - Verify the floor regenerates and the camera remains perfectly centered on the player at the new spawn location without disappearing.
