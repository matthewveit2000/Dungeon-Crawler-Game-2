# Milestone: EPIC 6: Loot Generation & Economy Math / Phase 27: Inventory Menu & Equipping

## 1. Executive Summary

Phase 27 completes Epic 6 by introducing the player's full Inventory and Equipment system. Players can open their inventory at any time by pressing 'I', which safely pauses the 5-minute countdown and all world entities. Equipping weapons and armor pieces dynamically enhances the player's combat statistics—increasing attack damage, reducing incoming enemy damage through defense ratings, and expanding maximum hit points.

## 2. Technical Decisions & Architecture

- **Tier 2 Equipment Engine ([`src/modules/Inventory.ts`](file:///c:/Users/matth/dev/Dungeon%20Crawler%20Game%202/Dungeon-Crawler-Game-2/src/modules/Inventory.ts)):** Manages discrete weapon and armor equipment slots, backpack item storage, and computes aggregate equipment stat modifiers without any PixiJS dependencies.
- **Combat Integration ([`src/modules/Player.ts`](file:///c:/Users/matth/dev/Dungeon%20Crawler%20Game%202/Dungeon-Crawler-Game-2/src/modules/Player.ts) & [`src/modules/Weapon.ts`](file:///c:/Users/matth/dev/Dungeon%20Crawler%20Game%202/Dungeon-Crawler-Game-2/src/modules/Weapon.ts)):** Weapon attacks add equipment bonus damage, player damage calculations subtract defense ratings, and maximum HP scales dynamically with armor bonuses.
- **Tier 1 Screen-Space UI ([`src/engine/InventoryOverlay.ts`](file:///c:/Users/matth/dev/Dungeon%20Crawler%20Game%202/Dungeon-Crawler-Game-2/src/engine/InventoryOverlay.ts)):** High-contrast UI overlay displaying equipped gear, aggregate bonus stats, and backpack item details.
- **Simulation Control:** Opening the inventory menu intercepts the delta feed via `gameLoop.isMenuOpen = true`, pausing timer and entities simultaneously.

## 3. Lessons Learned

Keeping UI overlays parented to `renderer.ui` rather than `renderer.world` ensures the menu remains statically centered on screen and is not skewed by camera pivots or zooms.

## 4. Effortless Audit Toolkit

**Audit Steps:**

1. Open the development server:
   👉 **[http://localhost:5173/](http://localhost:5173/)**
2. Open Developer Tools console (F12).
3. Toggle the inventory screen directly:
   ```javascript
   window.audit.openInventory();
   ```
   Notice the global timer freezes and the semi-transparent equipment overlay appears.
4. Press 'I' on the keyboard to close and resume the game.
5. Spawn and collect a high-tier item:
   ```javascript
   window.audit.spawnLootDrop();
   ```
   Walk over the dropped item to collect it into your backpack.
6. Equip the collected item:
   ```javascript
   window.audit.equipInventoryItem(0);
   ```
   Open the inventory (`window.audit.openInventory()` or press 'I') to verify the item is now in the equipped gear slot with active stat bonuses.
