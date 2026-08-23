# Systems & Mathematical Overview (SYSTEMS_OVERVIEW.md)

This document translates the player-facing gameplay experience into the underlying systems architecture and mathematical formulas utilized by Tier 2 (Modules) and Tier 3 (Packs). It is written without extreme developer jargon to ensure the Product Manager can understand exactly how the game calculates its outcomes.

## 1. Procedural World Architecture & Scale

The procedural map generation utilizes a modified random-walk algorithm.

- **The Abstract Grid:** The map does not exist as physical objects until the player is near them. Coordinates exist on a massive, theoretical mathematical grid. As the player explores, the game renders only the chunks of the grid currently in view, ensuring the game never runs out of memory, no matter how "infinite" the map feels.
- **Prefab Instancing:** Standard dungeon rooms are generated randomly, but "Cities" and "Boss Arenas" are pre-designed templates stored in Tier 3 Packs. The map generator injects these templates into the random grid at specific mathematical intervals.

## 2. The 5-Minute Timer Engine & Pausing

The game's strict global timer is not based on a standard computer clock, as that can desynchronize. It is bound directly to the engine's rendering frame loop.

- **The Mathematics of Time:** Every fraction of a second (Delta Time) is tracked. TimeRemaining = TimeRemaining - (DeltaTime * SimulationSpeed)
- **Menu Pausing:** The game features no traditional "Pause" button. Instead, when the player opens an inventory menu, the system sets the SimulationSpeed variable to 0.0. This multiplies the Delta Time by zero, mathematically freezing enemy movement, player movement, and the timer perfectly simultaneously without breaking the game's code.
- **The Zero-Second Rule:** The moment TimeRemaining is exactly 0.000 or lower, the core game loop intercepts all actions and fires a PERMADEATH event, overriding the screen and purging the current save state.

## 3. Combat, Loot Stats, and Scaling Mathematics

ARPG scaling math dictates the power curve. Items are not coded; they are generated dynamically using formulas.

**Item Generation Formula:** When an item is generated, its power is determined by the Current Floor Level and a randomly rolled Rarity tier.

Let L be the Item's Level (based on the floor). Let B be the Base Stat defined in the Tier 3 data (e.g., an Iron Sword's base damage is 10). Let Rm be the Rarity Multiplier.

Final Stat = B * (1 + (L * 0.1)) * Rm

**Rarity Tiers & Multipliers:** The rarity of an item strictly dictates how many game-changing Affixes it rolls, and how drastically its base stats are multiplied.

| Rarity Tier | Multiplier (Rm) | Affix Count | Drop Chance | Example Stat (Base 10, Level 5) |
|---|---:|---:|---:|---:|
| Common (White) | 1.0x | 0 | 60% | 15 Damage |
| Uncommon (Green) | 1.25x | 1 | 25% | 18.75 Damage |
| Rare (Blue) | 1.5x | 2 | 10% | 22.5 Damage |
| Epic (Purple) | 2.0x | 3 | 4% | 30 Damage |
| Legendary (Gold) | 3.0x | 4 | 1% | 45 Damage |

*Affix Generation Logic:* Affixes are not flat stat boosts. They introduce chaotic behaviors (e.g., "Attacks chain lightning to 3 nearby enemies"). This is handled by a Modifier Pipeline in the combat module that intercepts damage calculations before they are applied.

## 4. Experience & Leveling Curves

Leveling up grants two distinct point types: Attribute Points (for raw stat increases) and Skill Points (for unlocking skill tree nodes). To prevent a player from grinding infinitely on an easy floor, the XP required to reach the next level scales exponentially.

Let Lp be the Current Player Level. Let BaseXP be the baseline experience constant (e.g., 100).

XP Required = BaseXP * (Lp ^ 1.5)

## 5. Boss Arena State Machine Logic

Boss rooms rely on spatial triggers to govern their encounters, preventing the player from luring a boss out of its room.

1. **Neutral State:** The Boss is asleep. It does not possess an aggro radius. The door tiles to the room are passable.
2. **Locked State:** The moment the player's X/Y coordinates intersect the interior room boundary, the door tiles are overwritten with Wall colliders. The Boss shifts to an active AI state.
3. **Defeated State:** When the Boss's health reaches 0, the Wall colliders blocking the attached treasure room are deleted from the grid array, granting access to the loot.