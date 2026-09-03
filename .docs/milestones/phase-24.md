# Milestone: EPIC 6 / Phase 24: Item Generation & Rarity Multipliers

## 1. Executive Summary

Phase 24 launches **EPIC 6: Loot Generation & Economy Math** by building the Tier 2 procedural item generator and ARPG multiplicative scaling math.

- **Data-Driven Item Templates ([`src/packs/Items.json`](file:///c:/Users/matth/dev/Dungeon%20Crawler%20Game%202/Dungeon-Crawler-Game-2/src/packs/Items.json)):**
  - **Rarity Tiers:** Common (1.0x, 60% weight), Uncommon (1.4x, 25% weight), Rare (2.0x, 11% weight), Legendary (3.0x, 4% weight).
  - **Level Progression Factor:** 0.2 scaling per item level ($1 + (L - 1) \times 0.2$).
  - **Base Archetypes:** Weapons (Sword, Dagger, Bow, Staff) and Armor (Leather Tunic, Chainmail, Plate Cuirass).
- **Multiplicative Scaling Formula:**
  $$\text{Scaled Stat} = \lfloor \text{Base Stat} \times (1 + (L - 1) \times \text{LevelScalingFactor}) \times \text{RarityMultiplier} \rfloor$$
- **TDD Criteria Passed:** A Level 5 Legendary item mathematically produces strictly higher stats than a Level 1 Common item of the same base type (e.g. Sword: 81 damage vs. 15 damage).
- **Pure Tier 2 Deterministic Generation ([`src/modules/ItemGenerator.ts`](file:///c:/Users/matth/dev/Dungeon%20Crawler%20Game%202/Dungeon-Crawler-Game-2/src/modules/ItemGenerator.ts)):** Injects [`Rng`](file:///c:/Users/matth/dev/Dungeon%20Crawler%20Game%202/Dungeon-Crawler-Game-2/src/engine/Rng.ts) to guarantee 100% reproducible drops given identical seeds.
- **Audit Toolkit:** Added `window.audit.spawnLoot(level?, rarity?)` which prints formatted multi-line stat blocks into the console.

## 2. Technical Decisions & Architecture

- **Clean Architectural Separation:** `Item.ts` and `ItemGenerator.ts` are pure Tier 2 modules with zero `pixi.js` imports.
- **Console Stat Block Formatting:** `Item.toStatBlock()` produces human-readable, color-coded summaries for console auditing and upcoming UI tooltips.
- **Strict Line Count Compliance:** `src/main.ts` line count reduced to 228 lines (safely below the 240-line ceiling) by moving floor statistic calculations to `FloorManager.getFloorStats()`.

## 3. Effortless Audit Toolkit

**Audit Steps:**

1. Open the development server:
   👉 **[http://localhost:5173/](http://localhost:5173/)**
2. Open Developer Tools console (F12).
3. **Compare Low vs High Tier Loot:**
   - Run:
     ```javascript
     window.audit.spawnLoot(1, 'common');
     ```
     Inspect the printed stat block (e.g. `Common Sword (Lv. 1) -> Damage: +15`).
   - Run:
     ```javascript
     window.audit.spawnLoot(5, 'legendary');
     ```
     Notice the massive multiplicative power scaling (e.g. `Legendary Sword (Lv. 5) -> Damage: +81` or `Legendary Plate Cuirass (Lv. 5) -> Defense: +97, Max HP: +405`).
4. **Randomized Floor Loot:**
   - Run `window.audit.spawnLoot()` with no arguments to roll weighted rarity drops based on the current floor depth.
