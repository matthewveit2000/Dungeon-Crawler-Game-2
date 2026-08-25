# Milestone: EPIC 3 / Phase 11.5: Hardening Checkpoint

## 1. Executive Summary

The game plays properly now, and it will stay that way.

Three things changed for the player. **You can no longer get stuck.** Running diagonally into the corner of a wall used to wedge the character inside it, and once inside, every direction out was blocked too — the run was over and the page had to be reloaded. That was the real reason the map felt impossible to get around. **Walls are solid all the time.** If the browser stuttered for even a quarter of a second, the character would jump far enough in a single frame to pass straight through a wall and out of the world. **The game starts when you open it.** Previously you had to open a developer console and type a command before there was anything to control.

Two things changed for auditing. The macro map command — the one that shows the whole floor at once — had silently stopped displaying anything two phases ago, while still reporting success. It works again, shows the floor you are actually standing on, and can be toggled off. And descending now genuinely wipes the floor; the game was accumulating about 1.6 MB of memory per descent because nothing from a previous floor was ever released.

Underneath all of it, the automated checks that were supposed to catch this class of problem now actually run. They never had, in the entire history of the project.

## 2. Technical Decisions & Architecture

**Continuous integration.** The workflow file had been committed empty at the very first commit and had never been edited, so GitHub failed to parse it and every push reported failure — 28 runs, all red, with eleven pull requests merged past them. It now runs formatting, typecheck, the full test suite, a production build, and a guard that fails if any audit command named in a milestone document has disappeared from the bundle. `npm test` was also changed from watch mode, which never exits, to a single run.

**A fixed-timestep game loop.** Phase 3 was named for one but shipped a variable-delta loop. The simulation now advances in identical 1/60-second slices regardless of frame length, with a cap on how much real time one frame may contribute (so a backgrounded tab cannot teleport everything on return) and a cap on slices per frame (so a slow machine drops time rather than falling further behind). The loop also survives an error thrown by game code instead of dying permanently.

**Movement resolution extracted and corrected.** A shared Tier 2 `Movement` module now handles all body-versus-geometry movement, so enemies and projectiles will inherit the same rules rather than each reinventing them. Movement is split into substeps no longer than half a tile, and the vertical axis is resolved against the already-updated horizontal position — which is the specific change that closes the corner-cut. A blocked body settles flush against the wall by bisection rather than stopping a substep short.

**Tier boundary restored.** All four Tier 2 modules imported PixiJS directly. None do now. Drawing moved to a Tier 1 `TileRenderer` and a small view factory; entities describe their appearance as data. `Level` holds no rendering objects and is testable without a renderer.

**Game rules out of bootstrap.** Staircase placement and floor regeneration lived in `main.ts`, with the same search duplicated twice. They are now a Tier 2 `FloorManager` with fourteen tests. `main.ts` only wires systems together.

**Content moved to Tier 3.** `World.json`, `Player.json`, `Controls.json` and `Debug.json` join the existing `Interactables.json`. Speeds, sizes, colours, grid dimensions, generation parameters and keybindings are all data now.

**Seeded generation.** A `Rng` primitive replaces direct calls to browser randomness. The same seed always produces the same floor, which makes runs reproducible and lets the tests assert on generated maps.

**Entity lifecycle.** Removal destroys; `clear()` wipes the set; destruction is idempotent. Floor rebuilds are deferred until after entity updates finish, because the descent is triggered from inside the player's own update.

**Input edge state.** The input layer now reports keys that were tapped since the last frame, not just keys currently held. A press shorter than one frame used to be lost entirely, which made the staircase intermittently unresponsive.

## 3. Lessons Learned

**A broken signal is worse than no signal.** The empty CI file did not merely fail to catch problems; it produced a red mark on every single push, which taught everyone that red meant nothing. By the time a genuine regression appeared, the mechanism for noticing it had been ignored eleven times. Infrastructure has to be proven to run, not proven to exist.

**Fix the cause, not the symptom.** The player's inability to navigate the map was met with four commits shrinking the character from 40 pixels to 10, each described as making it fit through hallways. The character had always fitted — a 10-pixel body in a 40-pixel corridor has enormous slack. The cause was the collision routine, three phases upstream. Reproducing a bug before changing anything would have found it immediately.

**Tests must be able to fail.** Three separate tests in this codebase asserted things that could not have been false: connectivity guaranteed by the algorithm's structure, regeneration checked by object identity rather than content, and a delta-time assertion that wrote the missing fixed timestep into the suite as expected behaviour. Each reported safety that did not exist.

**Audit commands are a regression surface.** They live outside the test suite, so nothing calls them and they rot silently. `zoomOutMap()` broke in Phase 7, was made worse in Phase 10, and went on printing a success message throughout. A CI guard now catches deletions and renames; catching a command that runs but shows the wrong thing still requires a human opening a browser, which is now in the definition of done.

**Beware of fixing one thing and breaking another.** Two defects in this phase were introduced by this phase's own work and caught only by driving the real game in a browser: destroying the player mid-update threw and killed the game loop outright, and fast key taps were being dropped between frames. Neither showed up in the test suite. A green suite is necessary, not sufficient.

## 4. Effortless Audit Toolkit

**Audit Steps:**

1. Launch the local dev server (`npm run dev`) and open http://localhost:5173.
2. **Playable on load.** Verify a dungeon and a green character are already on screen, with nothing typed into a console. Move with WASD or the arrow keys.
3. **You cannot get stuck.** Hold two direction keys and run diagonally into the inside corner of a wall, repeatedly, from several angles. Verify you always slide along the wall and are never trapped.
4. **Walls are solid.** Push into a wall and hold. Verify you stop against it, not short of it, and never pass through.
5. **The macro map.** Open the console (F12), type `window.audit.zoomOutMap()`. Verify the whole floor appears on a dark panel, centred. Type it again to hide it.
6. **The map is the real one.** With the map showing, note the shape. Hide it, walk around, show it again — it is the same floor you are exploring.
7. **Reproducible runs.** Type `window.audit.setSeed(1234)` then `window.audit.zoomOutMap()`. Note the shape, then run both commands again. The floor should be identical.
8. **The floor really is wiped.** Type `window.audit.spawnTestSquare()` — a spinning red square appears beside you. Type `window.audit.teleportToStairs()`, press E. Verify a brand new floor loads and the red square is gone.
9. **Descending stays healthy.** Repeat step 8 about twenty times. Verify the game stays responsive and the console shows no errors.
10. **Floor statistics.** Type `window.audit.getFloorStats()` to see the floor's dimensions, how much is walkable, how far the staircase is, and how deep you have descended.
11. **Automated checks.** In a terminal, run `npm run verify` — typecheck, 134 tests and a production build should all pass. On GitHub, open the **Actions** tab and confirm the latest run is green.
