# Systems & Mathematical Overview (SYSTEMS_OVERVIEW.md)

This document translates the player-facing gameplay experience into the underlying systems architecture and mathematical formulas utilized by Tier 2 (Modules) and Tier 3 (Packs). It is written without extreme developer jargon to ensure the Product Manager can understand exactly how the game calculates its outcomes.

## 1. Procedural World Architecture & Scale

The procedural map generation utilizes a random-walk algorithm. Every parameter below lives in `src/packs/World.json`, so the scale and feel of a floor can be tuned without touching code.

- **The Grid:** A floor is a fixed grid of tiles held as a single flat array. At the shipped settings that is 160 x 160 tiles of 40 pixels each — a world 6,400 pixels square. The whole grid is generated up front when a floor is created.
- **Carving the Cave:** A walker starts at the centre of the grid and takes 40,000 random steps, stamping floor as it goes. Because the walker never teleports, every carved tile is connected to the start by construction: there can be no sealed-off pocket the player cannot reach.
- **Corridor Width:** The walker carves a single tile at a time. What makes a corridor comfortable is its width relative to the body moving down it, not its width in tiles: at 64-pixel tiles a one-tile corridor is 64 pixels against a 16-pixel collision box, four times the room needed. At the project's earlier 40-pixel tiles the same brush was tight enough that it was widened to three tiles; moving to 64-pixel art made that unnecessary. `packs.test.ts` asserts the ratio rather than the tile count, so the constraint holds through any future change of scale.
- **Rendering:** Only floor tiles are drawn, and runs of adjacent floor tiles along a row are merged into single rectangles. Solid rock is simply the background showing through, so the most common tile costs nothing to draw.
- **A Note on Scale:** The map is currently a bounded grid, not an endless one. It is large enough that crossing it takes real time, but it does have edges. Genuinely endless floors would need the map to be built and drawn in chunks as the player moves, which is a larger change and an open decision for the PM. This document will be updated when that decision is made — it must never describe a system the code does not have.
- **Prefab Instancing:** Standard dungeon caves are generated randomly, but "Cities" and "Boss Arenas" will be pre-designed templates stored in Tier 3 Packs. The map generator will inject these templates into the random grid at specific mathematical intervals. *(Planned for Epics 7 and 8; not yet built.)*

### Reproducible Runs

Every roll of the dice in world generation comes from a seeded generator rather than the browser's own randomness. The same seed always produces exactly the same floor. This makes a reported problem reproducible, lets the test suite assert on generated maps, and leaves the door open for players to share a seed.

## 1b. Art Resolution and Rendering Scale

The game's art is authored at a fixed resolution, and the rendering pipeline is built around keeping that resolution intact all the way to the screen. `.docs/ART_GUIDE.md` is the full specification; this section covers the systems consequences.

**Sprite resolution is 64 x 64 pixels.** One sprite is exactly one world tile, so art is placed at 1:1 with no scaling at import. `spriteResolution` and `tileSize` in `src/packs/World.json` state this once, everything else derives from them, and `src/packs/packs.test.ts` fails the build if they diverge.

**Scale is what makes or breaks pixel art.** Three rules govern it, and breaking any one produces the blurring or shimmering that makes pixel art look cheap:

- **Zoom is always a whole number.** At 1.5x, one art pixel covers one and a half screen pixels. That cannot be drawn evenly, so some rows of pixels come out thicker than others and the seams crawl as the camera moves.
- **Textures are sampled nearest-neighbour, never smoothed.** The default in most renderers is to blend neighbouring pixels, which is right for photographs and wrong for pixel art — it turns a hard edge into a soft gradient.
- **The camera position snaps to whole pixels.** A camera resting on a fractional coordinate puts every tile edge half-way across a screen pixel, and the whole world shimmers as the player walks. This is the single most common pixel-art rendering bug.

The first of these is a data constraint, the second and third are engine work scheduled as Epic 4.5.

**Screen coverage.** At 64 x 64 and 1x zoom, a 1280 x 800 window shows 20 x 12.5 tiles — a tactical view, wide enough to see an enemy approach and react. On displays large enough that the tile count becomes unreadable, a 2x zoom halves it.

**Sprite size is not collision size.** The player's sprite is a full 64 x 64 tile; the box collision is tested against is 16 x 16, a quarter of it, set by `sizeRatio`. The box stands for roughly the character's feet. A character colliding across their full sprite width could not pass through gaps their art suggests they should, which reads to a player as the game being unresponsive.

**Movement is stated in pixels but tuned in tiles.** Player speed is 320 pixels per second, which at 64-pixel tiles is 5 tiles per second. Tiles per second is the number that describes how the game feels; the pixel figure is a consequence of the tile size, and the two must be rescaled together.

## 1a. Movement and Collision

The player is a box that moves through a grid of solid tiles. Two rules keep that honest, and both exist because their absence caused real defects:

- **Movement is broken into small steps.** A body never moves more than half a tile between collision checks. Checking only the destination meant that during any stutter — a long frame, a garbage collection pause, or returning to a backgrounded tab — the player could jump clean over a wall and end up outside the map.
- **The two axes are resolved in sequence, not independently.** Horizontal movement is applied first, then vertical movement is checked against the *already updated* horizontal position. Checking both against the original position let the player slip diagonally into the inside corner of a wall. Once inside, every direction out was blocked too, and the run was over.

Where a body is blocked, it settles flush against the wall rather than stopping short of it, and continues sliding along the wall on the axis that is still free.

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