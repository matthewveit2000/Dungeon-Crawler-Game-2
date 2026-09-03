# Milestone: EPIC 7: Safe Zones (Cities) / Phase 30: Economy & Vendor NPCs

## 1. Executive Summary

Phase 30 concludes Epic 7 by establishing the in-game economy. Defeated dungeon enemies drop gold currency, and Sanctuary Haven houses a permanent Vendor NPC. Players can barter with the merchant to sell looted weapons and armor for gold or purchase essential supplies such as restorative Health Potions and upgraded equipment.

## 2. Technical Decisions & Architecture

- **Tier 3 Economy Schema ([`src/packs/Economy.json`](file:///c:/Users/matth/dev/Dungeon%20Crawler%20Game%202/Dungeon-Crawler-Game-2/src/packs/Economy.json)):** Dictates gold drops per monster kill, rarity-based sell pricing structures, and the vendor's goods catalog.
- **Tier 2 Merchant Logic ([`src/modules/Vendor.ts`](file:///c:/Users/matth/dev/Dungeon%20Crawler%20Game%202/Dungeon-Crawler-Game-2/src/modules/Vendor.ts)):** Manages trade transactions completely detached from PixiJS. Verifies purchasing solvency before item delivery and handles buyback calculations from player inventory.
- **Player Currency & Healing ([`src/modules/Player.ts`](file:///c:/Users/matth/dev/Dungeon%20Crawler%20Game%202/Dungeon-Crawler-Game-2/src/modules/Player.ts)):** Added currency tracking (`player.gold`) and responsive healing mechanics (`player.heal()`) to seamlessly process restorative item effects.
- **TDD Criteria Passed:** Validated exact currency deduction, rejection of insufficient funds, and healing effects upon potion consumption.

## 3. Lessons Learned

Designing the vendor as an Entity permits direct world placement in the safe haven alongside visual sprite rendering while delegating pure transactional logic to Tier 2 methods.

## 4. Effortless Audit Toolkit

**Audit Steps:**

1. Open the development server:
   👉 **[http://localhost:5173/](http://localhost:5173/)**
2. Open Developer Tools console (F12).
3. Teleport to Sanctuary Haven:
   ```javascript
   window.audit.teleportToCity();
   ```
4. Observe the golden merchant standing in the center of the safe room.
5. Grant funds and buy a health potion:
   ```javascript
   window.audit.damagePlayer(40);
   window.audit.addGold(50);
   window.audit.buyVendorItem('potion_health');
   ```
   Notice that 25 Gold is deducted and player health is restored.
6. Sell collected loot:
   ```javascript
   window.audit.spawnLootDrop();
   ```
   Walk over the item to place it in your backpack, then sell it:
   ```javascript
   window.audit.sellInventoryItem(0);
   ```
   Notice the earned gold deposited into your purse.
