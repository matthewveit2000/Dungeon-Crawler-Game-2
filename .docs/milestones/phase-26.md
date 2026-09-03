# Milestone: EPIC 6: Loot Generation & Economy Math / Phase 26: Dropping & Looting Logic

## 1. Executive Summary

Phase 26 introduces physical loot drops and collection in the dungeon world. Defeated monsters drop procedurally rolled weapons and armor directly onto the dungeon floor. When the player walks over dropped items, they are automatically collected from the ground and added to the player's personal inventory.

## 2. Technical Decisions & Architecture

- **Tier 2 Entity ([`src/modules/LootDrop.ts`](file:///c:/Users/matth/dev/Dungeon%20Crawler%20Game%202/Dungeon-Crawler-Game-2/src/modules/LootDrop.ts)):** Represents physical loot entities in the world grid. Rarity-colored visual presentation without importing `pixi.js` directly, keeping Tier 1/2 boundaries intact.
- **Lifecycle Integration ([`src/modules/FloorManager.ts`](file:///c:/Users/matth/dev/Dungeon%20Crawler%20Game%202/Dungeon-Crawler-Game-2/src/modules/FloorManager.ts)):** Defeated enemies spawn loot drops at their death coordinates. During each frame update, player proximity triggers collection into the `Player.inventory` array and disposes of the world entity.
- **TDD Criteria Passed:** Verified that collision with a loot entity removes it from the world entity array and appends it to the player inventory array.

## 3. Lessons Learned

Handling entity cleanup and collection during the unified floor update loop ensures that removed drop entities are properly detached and destroyed, avoiding orphan references on the stage.

## 4. Effortless Audit Toolkit

**Audit Steps:**

1. Open the development server:
   👉 **[http://localhost:5173/](http://localhost:5173/)**
2. Open Developer Tools console (F12).
3. Spawn an item on the ground right next to the player:
   ```javascript
   window.audit.spawnLootDrop();
   ```
4. Move the player with WASD over the dropped item.
5. Notice the item is collected from the ground. Verify in console:
   ```javascript
   // Inspect the collected item in player inventory
   ```
6. Alternatively, defeat any pursuing enemy on the floor and collect their dropped loot.
