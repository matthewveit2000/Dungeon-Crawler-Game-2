# Master Implementation Roadmap (ROADMAP.md)

**CRITICAL RULE:** Every single feature listed below must be executed as its own independent phase. You must not combine phases. Complete one phase, submit the PR with the Effortless Audit Toolkit, wait for PM approval, and only then proceed to the next phase.

## EPIC 1: Engine Foundation and Application Boot

- **Phase 1: Repository Scaffolding & CI Integration**

* *Objective:* Establish the package.json, install Vite, PixiJS, and Vitest. Build the strict directory tree.
* *Tier Impacted:* Root Infrastructure.
* *TDD Criteria:* Vitest configuration resolves successfully.
* *Verification:* PM verifies npm run dev yields a blank, error-free browser page.

- **Phase 2: PixiJS Canvas Mounting & Scaling**

* *Objective:* Initialize the PixiJS WebGL Application, attach it to the DOM, and create a module to handle dynamic browser resizing.
* *Tier Impacted:* Tier 1 (Engine).
* *TDD Criteria:* Resize events correctly update the application renderer dimensions.
* *Verification:* PM resizes the browser window and observes the canvas adjusting seamlessly.

- **Phase 3: The Fixed-Timestep Game Loop**

* *Objective:* Implement a robust game ticker utilizing requestAnimationFrame that calculates delta time and distributes it to update functions. Avoid standard setInterval approaches.
* *Tier Impacted:* Tier 1 (Engine).
* *TDD Criteria:* Delta time is mathematically consistent across 10 simulated frames.
* *Verification:* PM accesses window.audit.getFPS() in the console to verify a stable 60 FPS.

- **Phase 4: Input State Manager**

* *Objective:* Build a unified capture system for keyboard (WASD) and mouse coordinates.
* *Tier Impacted:* Tier 1 (Engine).
* *TDD Criteria:* Simulated keydown events correctly toggle boolean states in the input payload.
* *Verification:* PM uses window.audit.logInputs = true to see real-time keystroke tracking in the console.

## EPIC 2: Entity Architecture and Kinematics

- **Phase 5: The Entity Manager Scaffold**

* *Objective:* Create a lightweight manager to track and update active game objects (Entities).
* *Tier Impacted:* Tier 1 & Tier 2.
* *TDD Criteria:* Adding and removing entities updates the active entity array.
* *Verification:* PM runs window.audit.spawnTestSquare() to observe an entity rendering.

- **Phase 6: Player Entity & 2D Movement**

* *Objective:* Implement the Player entity. Link the Tier 1 Input Manager to Tier 2 Kinematics to apply velocity based on delta time.
* *Tier Impacted:* Tier 2 (Modules).
* *TDD Criteria:* Player X/Y coordinates translate accurately relative to delta time when input states are active.
* *Verification:* PM can move a placeholder player sprite using the WASD keys.

- **Phase 7: Camera Tracking Logic**

* *Objective:* Implement a virtual camera that locks onto the player's center coordinates and offsets the global stage rendering.
* *Tier Impacted:* Tier 1 (Engine).
* *TDD Criteria:* Stage pivot updates mathematically perfectly inverse to player movement.
* *Verification:* PM moves the player; the character remains centered while the grid moves.

## EPIC 3: Procedural World Generation

- **Phase 8: Map Grid Data Architecture**

* *Objective:* Build the backend spatial grid utilizing a 1D array to represent 2D space for optimized memory lookups.
* *Tier Impacted:* Tier 2 (Modules).
* *TDD Criteria:* Coordinates (X, Y) successfully map to the correct array indices.
* *Verification:* Automated tests pass; no visual audit required yet.

- **Phase 9: Infinite-Feeling Random Walker Algorithm**

* *Objective:* Implement a procedural generation algorithm to carve out massive, contiguous floor spaces. The map must feel vast and endless to the player.
* *Tier Impacted:* Tier 2 (Modules).
* *TDD Criteria:* The algorithm produces no isolated or unreachable floor tiles.
* *Verification:* PM runs window.audit.zoomOutMap() to view the macro-scale map generation.

- **Phase 10: Tile Rendering & AABB Collision**

* *Objective:* Render the floor and wall tiles via PixiJS. Implement Axis-Aligned Bounding Box (AABB) collision to restrict player movement.
* *Tier Impacted:* Tier 1 & Tier 2.
* *TDD Criteria:* Entity velocity is zeroed out upon intersecting a tile marked as "Wall".
* *Verification:* PM explores the map and is physically blocked by wall tiles.

- **Phase 11: The Exit Staircase Mechanic**

* *Objective:* Spawn a staircase entity far from the player spawn. Interacting with it wipes the current floor and regenerates a new one.
* *Tier Impacted:* Tier 2 & Tier 3.
* *TDD Criteria:* Interaction distance checks succeed, and floor state resets.
* *Verification:* PM runs window.audit.teleportToStairs(), interacts, and sees a completely new map load.

- **Phase 11.5: Hardening Checkpoint** *(inserted after the Epic 1-3 audit; complete)*

* *Objective:* Close the defects and architectural drift found by the audit of Epics 1-3 before further systems are built on top of them. Repair continuous integration, replace the variable-delta loop with a true fixed timestep, fix wall tunnelling and diagonal corner-cutting, restore the Tier 1/Tier 2 boundary, move hardcoded values into Tier 3, seed world generation, fix entity lifecycle leaks, and repair the audit toolkit.
* *Tier Impacted:* All tiers, plus repository infrastructure.
* *TDD Criteria:* Regression tests for every defect, each written to fail against the previous implementation.
* *Verification:* PM follows the audit steps in `.docs/milestones/phase-11.5.md`.

### Settled: Art Resolution

Sprite resolution is fixed at **32 x 32 pixels**, one sprite to one world tile, with a default camera zoom of 2x. The world grid stays 160 x 160 tiles, which at 32-pixel tiles is 5,120 pixels square. The project moved 40 -> 64 in Phase 11.6 and 64 -> 32 in Phase 11.7, the latter to gain access to the freely licensed 32 x 32 art ecosystem; player speed was rescaled each time so movement stays at 5 tiles per second — an identical feel, expressed in new units.

The full specification is `.docs/ART_GUIDE.md`. The rendering work this implies is Epic 4.5 above.

### Open Decision: World Scale

The world is a bounded grid, not an endless one. It is 160 x 160 tiles, which at 32-pixel tiles is 5,120 pixels square, and puts the staircase roughly twenty seconds of running away in a straight line before any exploration. Epic 4 gives the player three hundred seconds. (Neither change of art resolution affected this: the grid is the same number of tiles and the player covers the same tiles per second.)

Whether that is the right shape for the game is a PM decision, not a technical one, and it should be settled before Epic 4 is designed:

- **Genuinely endless floors.** Grow the grid substantially and build the chunked, view-culled rendering that would require. Closest to the vision in `README.md`; the largest piece of work.
- **Same grid, different pacing.** Slow the player and shrink the tiles so the existing map takes minutes to cross. Cheap, but floors stay structurally small and will start to feel repetitive.
- **Accept compact floors.** Make the five minutes about surviving combat and choosing when to descend, rather than about finding the stairs. Also cheap, but the exploration fantasy in `README.md` and `.docs/PLAYER_GUIDE.md` would need rewriting.

`.docs/SYSTEMS_OVERVIEW.md` describes the bounded grid that exists today and must be updated in whichever PR settles this.

## EPIC 4: The 5-Minute Timer & Simulation Control

- **Phase 12: Delta-Time Countdown Logic**

* *Objective:* Create the global timer starting at 5:00. It must deduct delta time every frame, completely uncoupled from the system clock.
* *Tier Impacted:* Tier 2 (Modules).
* *TDD Criteria:* Timer accurately deducts exact delta values per frame.
* *Verification:* PM observes a UI text element ticking down flawlessly.

- **Phase 13: Menu Pausing Interception**

* *Objective:* Ensure the timer (and all entity updates) pause *only* when a menu is open. No other pausing is permitted.
* *Tier Impacted:* Tier 1 & Tier 2.
* *TDD Criteria:* Setting isMenuOpen to true intercepts the delta-time feed, stopping simulation.
* *Verification:* PM triggers a dummy menu, sees the timer freeze, closes the menu, and sees it instantly resume.

- **Phase 14: The Zero-Second Permadeath Event**

* *Objective:* If the timer reaches exactly 0:00, intercept all logic, kill the player, and force a Game Over screen.
* *Tier Impacted:* Tier 2 (Modules).
* *TDD Criteria:* Timer hitting zero fires the death event and zeroes player health.
* *Verification:* PM uses window.audit.setTimer(3) and waits 3 seconds to verify instant death.

- **Phase 15: EPIC 1-4 Refactoring Checkpoint**

* *Objective:* Execute the mandatory phase-based cleanup. Profile for memory leaks and ensure AABB collision logic is optimized.
* *Checklist:* Run the architectural tripwires in `AGENTS.md` §7 — no Tier 2 module importing `pixi.js`, no magic numbers outside Tier 3, no game rules in `main.ts`, nothing removed without being destroyed, and all randomness seeded. Measure the heap across fifty floor descents and confirm it does not trend upward.

## EPIC 4.5: Pixel Art Rendering Pipeline

*Inserted after the art resolution was settled, and retargeted to 32 x 32 in Phase 11.7. These phases must complete before Epic 5, because the moment enemies exist they will need sprites, and every entity built before the pipeline exists is one that has to be retrofitted afterwards. Specification: `.docs/ART_GUIDE.md`.*

- **Phase 16: Pixel-Perfect Rendering Foundation**

* *Objective:* Make the renderer preserve authored pixels exactly. Sample textures nearest-neighbour rather than smoothing them, support a whole-number camera zoom applied from `defaultZoom` in `World.json`, and snap the camera position to whole pixels so the world does not shimmer as the player moves. No art is introduced in this phase; it prepares the surface that art will land on.
* *Tier Impacted:* Tier 1 (Engine).
* *TDD Criteria:* The camera pivot resolves to whole pixels at every zoom level and every fractional player position. A non-integer zoom is rejected. Texture sampling defaults to nearest-neighbour.
* *Verification:* PM confirms the game opens at the default 2x zoom showing about 20 tiles across, runs window.audit.setZoom(4) and confirms the view doubles cleanly with no blurring, then walks around and confirms no shimmering or crawling along tile edges.

- **Phase 17: Sprite Loading & the Tier 3 Art Pack**

* *Objective:* Load 32 x 32 sprites declared in Tier 3 and draw entities and tiles with them instead of flat coloured rectangles. Missing art must fall back to the current coloured placeholder with a console warning rather than crashing, per the Graceful Failure rule.
* *Tier Impacted:* Tier 1 & Tier 3.
* *TDD Criteria:* An entity resolves its art from a Tier 3 declaration; a declaration pointing at missing art yields a placeholder and a warning, not an exception. A sprite whose dimensions are not a whole multiple of the tile size is rejected at load.
* *Verification:* PM sees drawn tiles and a drawn character in place of coloured squares, and window.audit.spawnTestSquare() still works.

- **Phase 18: Sprite Animation**

* *Objective:* Play frame sequences (idle, walk, and later attack) declared in Tier 3, advanced by the fixed-timestep loop so playback is identical on any machine.
* *Tier Impacted:* Tier 1 & Tier 3.
* *TDD Criteria:* An animation advances by a deterministic number of frames per fixed step; the same elapsed time always produces the same frame regardless of how it was divided into updates.
* *Verification:* PM watches the character animate while walking and rest on an idle frame when stopped.

- **Phase 19: EPIC 4.5 Art Pipeline Checkpoint**

* *Objective:* Confirm the pipeline holds before combat multiplies the asset count. Verify no non-integer scaling anywhere in the render path, measure texture memory across floor descents, and confirm the placeholder fallback still works for every entity type.

## EPIC 5: Combat Systems & Entity AI

- **Phase 20: Health, Damage, & Stats Framework**

* *Objective:* Implement base stats and a unified damage application method for all entities.
* *Tier Impacted:* Tier 2 (Modules).
* *TDD Criteria:* Damage application accurately reduces Health; dropping below zero triggers entity destruction.
* *Verification:* PM runs window.audit.damagePlayer(10) and sees health decrease on UI.

- **Phase 21: Standard Enemy Definitions & Spawning**

* *Objective:* Define standard enemies using JSON in Tier 3 (Packs) and implement dynamic spawning across the floor based on density rules.
* *Tier Impacted:* Tier 2 & Tier 3.
* *TDD Criteria:* Spawner reads Tier 3 JSON and instantiates entities with correct stats.
* *Verification:* PM explores the map and observes standard enemy sprites.

- **Phase 22: Enemy Aggro Radius & Pathfinding**

* *Objective:* Enemies detect the player within a set radius and move toward them.
* *Tier Impacted:* Tier 2 (Modules).
* *TDD Criteria:* State machine shifts from IDLE to AGGRO when player enters radius.
* *Verification:* PM steps near an enemy and verifies they are chased.

- **Phase 23: Player Combat Mechanics (Melee & Ranged)**

* *Objective:* Allow the player to attack using predefined weapon archetypes, spawning hitboxes or projectiles.
* *Tier Impacted:* Tier 2 (Modules).
* *TDD Criteria:* Attack hitboxes intersecting with enemy hurtboxes successfully dispatch damage events.
* *Verification:* PM clicks to attack and kills a pursuing enemy.

## EPIC 6: Loot Generation & Economy Math

- **Phase 24: Item Generation & Rarity Multipliers**

* *Objective:* Build the Tier 2 item generator. Implement ARPG multiplicative scaling math based on item level and rarity (e.g., Legendary = 3x base stats).
* *Tier Impacted:* Tier 2 & Tier 3.
* *TDD Criteria:* A Level 5 Legendary item outputs strictly higher mathematical stats than a Level 1 Common item according to the formulas.
* *Verification:* PM runs window.audit.spawnLoot() and evaluates the printed stat blocks.

- **Phase 25: Affix Generator**

* *Objective:* Apply chaotic game-changing effects to items based strictly on rarity tier (Common = 0, Rare = 2, Legendary = 4).
* *Tier Impacted:* Tier 2 & Tier 3.
* *TDD Criteria:* Generator enforces exact affix counts based on the rarity enum.
* *Verification:* PM generates a Legendary item and verifies it has exactly 4 affixes.

- **Phase 26: Dropping & Looting Logic**

* *Objective:* Enemies drop loot upon death. Players can walk over items to pick them up.
* *Tier Impacted:* Tier 2 (Modules).
* *TDD Criteria:* Collision with a loot entity removes it from the world array and pushes it to the player inventory array.
* *Verification:* PM kills an enemy, sees the item sprite, and walks over it to collect it.

- **Phase 27: Inventory Menu & Equipping**

* *Objective:* Build the UI to equip loot. Ensure opening the menu pauses the global timer.
* *Tier Impacted:* UI & Tier 2.
* *TDD Criteria:* Equipping an item successfully modifies the player's base combat stats.
* *Verification:* PM opens inventory, equips a sword, and deals increased damage to enemies.

## EPIC 7: Safe Zones (Cities)

- **Phase 28: City Prefab Injection**

* *Objective:* Modify the map generator to occasionally carve out a predefined "Safe Zone" room.
* *Tier Impacted:* Tier 2 & Tier 3.
* *TDD Criteria:* City tiles are successfully flagged in the data grid as IS_SAFE_ZONE.
* *Verification:* PM uses window.audit.teleportToCity() to verify the visual room layout.

- **Phase 29: City De-Aggro AI Directives**

* *Objective:* When the player's coordinate is inside a safe zone, all enemies must instantly drop aggro and flee.
* *Tier Impacted:* Tier 2 (Modules).
* *TDD Criteria:* Player intersecting safe zone tile forces all active enemy states to FLEE.
* *Verification:* PM aggros an enemy outside the city, runs inside, and verifies the enemy retreats.

- **Phase 30: Economy & Vendor NPCs**

* *Objective:* Introduce currency drops and a vendor inside the city allowing the player to buy/sell items.
* *Tier Impacted:* Tier 2 (Modules).
* *TDD Criteria:* Buying an item deducts the exact currency amount; transaction fails if funds are insufficient.
* *Verification:* PM sells loot to the vendor and buys a health potion.

## EPIC 8: Boss Encounters & Arena Logic

- **Phase 31: Boss Arena Generation**

* *Objective:* Inject a locked boss room prefab containing a demo boss and an attached treasure room.
* *Tier Impacted:* Tier 2 & Tier 3.
* *TDD Criteria:* Room generates with a distinct entryway and attached treasure room boundaries.
* *Verification:* PM uses window.audit.teleportToBoss().

- **Phase 32: Spatial Door Locking & Neutral State**

* *Objective:* The Boss remains entirely neutral until the player steps inside. Entering the room instantly converts the door tiles to impassable walls.
* *Tier Impacted:* Tier 2 (Modules).
* *TDD Criteria:* Player intersecting the threshold triggers tile mutation and shifts Boss to AGGRO.
* *Verification:* PM walks into the room, is physically trapped by new walls, and the boss attacks.

- **Phase 33: Defeat Triggers & Treasure Rewards**

* *Objective:* Killing the boss destroys the wall tiles blocking the treasure room, which contains highly weighted loot.
* *Tier Impacted:* Tier 2 (Modules).
* *TDD Criteria:* Boss HP hitting zero dispatches event to mutate treasure room door tiles to floor tiles.
* *Verification:* PM kills the boss via window.audit.killTarget() and loots the adjoining room.

## EPIC 9: Character Progression

- **Phase 34: XP & Leveling Framework**

* *Objective:* Enemies grant XP. Reaching mathematical thresholds increments the Player Level.
* *Tier Impacted:* Tier 2 (Modules).
* *TDD Criteria:* XP threshold formula calculates correctly; level increments upon XP exceeding threshold.
* *Verification:* PM kills an enemy and observes the level/XP bar increase.

- **Phase 35: Dual Point System**

* *Objective:* Leveling up grants 1 Attribute Point and 1 Skill Point.
* *Tier Impacted:* Tier 2 (Modules).
* *TDD Criteria:* Level increment event accurately dispatches additions to both point pools.
* *Verification:* Automated tests pass.

- **Phase 36: Attribute & Skill Allocation Menus**

* *Objective:* Build the UI allowing the player to spend Attribute points on base stats and Skill points on a structured node tree.
* *Tier Impacted:* UI & Tier 2.
* *TDD Criteria:* Spending points deducts total and permanently applies stat modifiers.
* *Verification:* PM opens the menu, spends points, and validates increased stats.

- **Phase 37: Final Polish & Architectural Audit**

* *Objective:* AI conducts a comprehensive code review across all tiers to enforce strict adherence to specifications prior to version 1.0 release.