# Milestone: EPIC 9: Character Progression / Phase 34: XP & Leveling Framework

## 1. Executive Summary

Phase 34 marks the beginning of Epic 9 with the character progression framework. Monsters vanquished in combat grant experience points (XP). When the player accumulates sufficient XP to cross mathematically scaled leveling thresholds ($BaseXP \times Level^{1.5}$), the character levels up, advancing their capabilities and preparing them for subsequent attribute and skill point distribution.

## 2. Technical Decisions & Architecture

- **Tier 3 Progression Schema ([`src/packs/Progression.json`](file:///c:/Users/matth/dev/Dungeon%20Crawler%20Game%202/Dungeon-Crawler-Game-2/src/packs/Progression.json)):** Declares base XP (50), exponential scaling exponent (1.5), enemy kill XP yields (e.g. Goblin: 25 XP, Skeleton: 35 XP, Boss: 250 XP), and future attribute/skill definitions.
- **Progression Logic ([`src/modules/Progression.ts`](file:///c:/Users/matth/dev/Dungeon%20Crawler%20Game%202/Dungeon-Crawler-Game-2/src/modules/Progression.ts)):** Manages XP accrual, calculates current level threshold, and supports multi-level overflow when substantial XP awards are granted.
- **Player & Combat Coupling ([`src/modules/Player.ts`](file:///c:/Users/matth/dev/Dungeon%20Crawler%20Game%202/Dungeon-Crawler-Game-2/src/modules/Player.ts) & [`src/modules/FloorManager.ts`](file:///c:/Users/matth/dev/Dungeon%20Crawler%20Game%202/Dungeon-Crawler-Game-2/src/modules/FloorManager.ts)):** Player entity tracks progression state, recalculates equipped stats upon leveling, and automatically receives XP on every monster or boss defeat.
- **TDD Criteria Passed:** Validated exponential threshold calculations, level advancement on threshold crossings, and multi-level rollover handling.

## 3. Lessons Learned

Isolating the internal `Level` map object reference as `levelModule` in `Player.ts` prevents naming collision with the numerical `player.level` character progression getter.

## 4. Effortless Audit Toolkit

**Audit Steps:**

1. Open the development server:
   👉 **[http://localhost:5173/](http://localhost:5173/)**
2. Open Developer Tools console (F12).
3. Check current level stats:
   ```javascript
   window.audit.getLevelStats();
   ```
   Notice initial Level 1 with 0 XP towards the 50 XP threshold.
4. Grant experience points to level up:
   ```javascript
   window.audit.grantXP(60);
   ```
   Observe the player level up to Level 2 with 10 surplus XP towards the 141 XP threshold.
5. Slay an enemy to earn organic combat XP:
   ```javascript
   window.audit.teleportToEnemy(0);
   window.audit.playerAttack();
   ```
