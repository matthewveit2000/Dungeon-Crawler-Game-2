# Milestone: EPIC 6: Loot Generation & Economy Math / Phase 25: Affix Generator

## 1. Executive Summary

Phase 25 builds procedural magic affixes onto the loot generation system. Every item dropped or found in the dungeon now gains special descriptive qualities and modifiers based strictly on its rarity tier. Common items carry 0 affixes, Uncommon items gain 1 affix, Rare items gain 2 affixes, and Legendary items carry 4 distinct affixes.

## 2. Technical Decisions & Architecture

- **Tier 3 Data Pack ([`src/packs/Affixes.json`](file:///c:/Users/matth/dev/Dungeon%20Crawler%20Game%202/Dungeon-Crawler-Game-2/src/packs/Affixes.json)):** Declares the exact affix counts per rarity enum and provides the affix modifier pool (such as *Blazing*, *Thundering*, *Vampiric*, *Colossal*, and *Fortified*).
- **Tier 2 Deterministic Generation ([`src/modules/AffixGenerator.ts`](file:///c:/Users/matth/dev/Dungeon%20Crawler%20Game%202/Dungeon-Crawler-Game-2/src/modules/AffixGenerator.ts)):** Injects seeded `Rng` to ensure drop reproducibility and prevents duplicate affixes on the same item.
- **Stat Block Integration ([`src/modules/Item.ts`](file:///c:/Users/matth/dev/Dungeon%20Crawler%20Game%202/Dungeon-Crawler-Game-2/src/modules/Item.ts)):** Formats attached affixes cleanly in `Item.toStatBlock()` for UI display and console auditing.

## 3. Lessons Learned

Keeping base stat scaling separated from affix modifier properties was crucial to preserving the ARPG formula verified in Phase 24 while cleanly adding special properties.

## 4. Effortless Audit Toolkit

**Audit Steps:**

1. Open the development server:
   👉 **[http://localhost:5173/](http://localhost:5173/)**
2. Open the browser console (Press F12).
3. Generate a Legendary item to verify it has exactly 4 affixes:
   ```javascript
   window.audit.generateAffixedItem('legendary');
   ```
   Inspect the printed stat block to confirm 4 distinct affixes are attached.
4. Test other rarity tiers:
   ```javascript
   window.audit.generateAffixedItem('rare');     // Exactly 2 affixes
   window.audit.generateAffixedItem('uncommon'); // Exactly 1 affix
   window.audit.generateAffixedItem('common');   // Exactly 0 affixes
   ```
