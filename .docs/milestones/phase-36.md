# Milestone: EPIC 9: Character Progression / Phase 36: Attribute & Skill Allocation Menus

## 1. Executive Summary

Phase 36 implements the user interface for character customization: the Progression Overlay Menu. Players can open the menu at any time by pressing 'P' to review level progression, experience thresholds, point pools, core attributes, passive skill nodes, and live combat statistics. Players can allocate points to boost attributes or unlock skill tree perks, with changes persisting across floor descents.

## 2. Technical Decisions & Architecture

- **Visual Character Sheet ([`src/engine/ProgressionOverlay.ts`](file:///c:/Users/matth/dev/Dungeon%20Crawler%20Game%202/Dungeon-Crawler-Game-2/src/engine/ProgressionOverlay.ts)):** Tier 1 PixiJS overlay displaying player level, XP bar, available point pools, attribute breakdown, passive skill nodes with current ranks, and player defense/health/damage totals.
- **Simulation Pausing ([`src/main.ts`](file:///c:/Users/matth/dev/Dungeon%20Crawler%20Game%202/Dungeon-Crawler-Game-2/src/main.ts)):** Pressing 'P' toggles the overlay and halts the game loop delta time (`gameLoop.isMenuOpen`), allowing unpressured point allocation.
- **Dynamic Allocation Handlers ([`src/engine/ProgressionOverlay.ts`](file:///c:/Users/matth/dev/Dungeon%20Crawler%20Game%202/Dungeon-Crawler-Game-2/src/engine/ProgressionOverlay.ts)):** Interacts with `Player.progression`, validates point balances and max rank caps, and synchronously refreshes equipped stats and view text.
- **TDD Criteria Passed:** Validated that point allocations deduct balances, apply stat modifications permanently, and cap when points are depleted.

## 3. Lessons Learned

Sharing the `gameLoop.isMenuOpen` pause state between `InventoryOverlay` ('I') and `ProgressionOverlay` ('P') guarantees that time remains safely paused regardless of which menu the player is exploring.

## 4. Effortless Audit Toolkit

**Audit Steps:**

1. Open the development server:
   👉 **[http://localhost:5173/](http://localhost:5173/)**
2. Grant experience points to accumulate points:
   ```javascript
   window.audit.grantXP(60);
   ```
3. Open the Character Progression menu:
   ```javascript
   window.audit.openProgressionMenu();
   ```
   Or press **P** on the keyboard.
4. Spend an attribute point:
   ```javascript
   window.audit.spendAttributePoint('vitality');
   ```
   Observe the updated character sheet showing +15 Max HP and 0 remaining attribute points.
5. Spend a skill point:
   ```javascript
   window.audit.spendSkillPoint('stoneSkin');
   ```
   Observe the updated character sheet showing Rank 1/3 Stone Skin (+5 Defense) and 0 remaining skill points.
6. Press **P** to close the progression overlay and return to dungeon exploration.
