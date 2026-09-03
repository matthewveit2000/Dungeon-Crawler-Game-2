# Milestone: EPIC 5 / Phase 23: Player Combat Mechanics (Melee & Ranged)

## 1. Executive Summary

Phase 23 delivers active combat mechanics to the dungeon crawler, completing **EPIC 5: Combat Systems & Entity AI**. The player can now engage pursuing monsters using melee and ranged weapons.

- **Data-Driven Weapons ([`src/packs/Weapons.json`](file:///c:/Users/matth/dev/Dungeon%20Crawler%20Game%202/Dungeon-Crawler-Game-2/src/packs/Weapons.json)):** Configured weapon archetypes in Tier 3:
  - `sword`: Iron Longsword (Melee: 25 damage, 0.3s cooldown, 32px range, 36x36px hitbox).
  - `bow`: Hunting Bow (Ranged: 15 damage, 0.35s cooldown, 350px/s projectile speed, 250px max range).
- **Melee Arc Hitbox Generation ([`src/modules/Weapon.ts`](file:///c:/Users/matth/dev/Dungeon%20Crawler%20Game%202/Dungeon-Crawler-Game-2/src/modules/Weapon.ts)):** Attacking with a melee weapon generates a forward-facing hitbox that tests AABB intersections against enemy hurtboxes, applying damage and respecting cooldowns.
- **Ranged Projectile Simulation ([`src/modules/Projectile.ts`](file:///c:/Users/matth/dev/Dungeon%20Crawler%20Game%202/Dungeon-Crawler-Game-2/src/modules/Projectile.ts)):** Firing a ranged weapon launches a high-speed projectile toward the mouse aim coordinates. Projectiles collide with dungeon walls or enemy hurtboxes, dealing damage and dissipating.
- **Controls & Aiming ([`src/packs/Controls.json`](file:///c:/Users/matth/dev/Dungeon%20Crawler%20Game%202/Dungeon-Crawler-Game-2/src/packs/Controls.json)):**
  - Attack via **Left Mouse Click** or **Spacebar**.
  - Swap weapons via **Q**.
  - Cursor coordinates are converted from screen to world coordinates using [`Camera.screenToWorld`](file:///c:/Users/matth/dev/Dungeon%20Crawler%20Game%202/Dungeon-Crawler-Game-2/src/engine/Camera.ts).
- **Defeated Monster Lifecycle ([`src/modules/FloorManager.ts`](file:///c:/Users/matth/dev/Dungeon%20Crawler%20Game%202/Dungeon-Crawler-Game-2/src/modules/FloorManager.ts)):** When an enemy's HP reaches 0, it is removed from active enemy lists and its entity is destroyed.

## 2. Technical Decisions & Architecture

- **Tier 2 Independence:** `Weapon.ts` and `Projectile.ts` are pure Tier 2 modules with zero `pixi.js` imports, strictly using entity visual specs.
- **Hitbox Dead Zone Prevention:** Melee hitboxes are centered between the player origin and weapon reach (`range / 2`), ensuring enemies touching or adjacent to the player are hit reliably.
- **Audit Toolkit:** Added `window.audit.playerAttack(targetX, targetY)` and `window.audit.equipWeapon(id)`.

## 3. Effortless Audit Toolkit

**Audit Steps:**

1. Open the development server:
   👉 **[http://localhost:5173/](http://localhost:5173/)**
2. **Melee Combat Audit:**
   - Run in console:
     ```javascript
     window.audit.teleportToEnemy(0);
     ```
   - Click the left mouse button (or press Space) to swing your sword.
   - Observe that the pursuing monster takes damage and is eliminated when its health reaches 0.
3. **Weapon Swapping & Ranged Projectiles:**
   - Press **Q** (or run `window.audit.equipWeapon('bow')`) to equip the Hunting Bow.
   - Click to aim and fire: observe golden energy projectiles flying toward your cursor, dissipating when impacting walls or damaging monsters.
