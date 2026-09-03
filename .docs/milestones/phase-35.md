# Milestone: EPIC 9: Character Progression / Phase 35: Dual Point System

## 1. Executive Summary

Phase 35 expands player development by introducing a Dual Point System. Upon crossing a level threshold, the character receives 1 Attribute Point and 1 Skill Point per level gained. Players can spend Attribute Points on core statistics (Strength, Vitality, Agility) and Skill Points on passive combat perks (Whirlwind Strike, Stone Skin, Swiftness), providing distinct paths for customization.

## 2. Technical Decisions & Architecture

- **Dual Pool Progression ([`src/modules/Progression.ts`](file:///c:/Users/matth/dev/Dungeon%20Crawler%20Game%202/Dungeon-Crawler-Game-2/src/modules/Progression.ts)):** `ProgressionManager` manages independent integer pools for `attributePoints` and `skillPoints`, accurately incrementing both during single- and multi-level level-up events.
- **Allocation Rules ([`src/modules/Progression.ts`](file:///c:/Users/matth/dev/Dungeon%20Crawler%20Game%202/Dungeon-Crawler-Game-2/src/modules/Progression.ts)):** Validates available point balances and caps skill allocations to the configured `maxRank` (3).
- **Stat Derivation ([`src/modules/Player.ts`](file:///c:/Users/matth/dev/Dungeon%20Crawler%20Game%202/Dungeon-Crawler-Game-2/src/modules/Player.ts)):** Attribute investments (Vitality -> HP, Strength -> Attack Damage, Stone Skin -> Defense) dynamically integrate with equipment bonuses during stat refresh calculations.
- **TDD Criteria Passed:** Validated that single and multi-level level-ups grant equal point disbursements to both pools and point allocations scale character combat parameters.

## 3. Lessons Learned

Centralizing stat recalculations inside `player.refreshEquippedStats()` ensures that both equipment changes and attribute allocation gains apply cleanly to maximum health and mitigation without state desynchronization.

## 4. Effortless Audit Toolkit

**Audit Steps:**

1. Open the development server:
   👉 **[http://localhost:5173/](http://localhost:5173/)**
2. Open Developer Tools console (F12).
3. Grant XP to advance to Level 2:
   ```javascript
   window.audit.grantXP(60);
   ```
4. Check the dual point pools:
   ```javascript
   window.audit.getPointPools();
   ```
   Confirm you have `attributePoints: 1` and `skillPoints: 1`.
5. Allocate an attribute point:
   ```javascript
   window.audit.allocatePoint('attribute', 'vitality');
   ```
   Confirm max HP increases by +15 and attribute point pool is consumed.
6. Allocate a skill point:
   ```javascript
   window.audit.allocatePoint('skill', 'stoneSkin');
   ```
   Confirm +5 flat defense is unlocked and skill point pool is consumed.
