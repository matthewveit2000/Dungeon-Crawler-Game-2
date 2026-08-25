# Milestone: EPIC 3 / Phase 11: The Exit Staircase Mechanic

## 1. Executive Summary

Players can now interact with a staircase placed far away from their starting position on the floor. When they stand near the staircase and press the 'E' key, the current floor is wiped clean, and a completely new, procedurally generated floor is created, allowing them to progress deeper into the dungeon endlessly.

## 2. Technical Decisions & Architecture

Implemented the `Staircase` entity, which reads its properties from a newly introduced `Interactables.json` data pack in Tier 3. The `Level` module (Tier 2) gained a `regenerate()` method that discards the old grid and carves a fresh one. Distance-checking interaction logic on the player triggers the descent only when within range of the stairs.

**Restructured in Phase 11.5.** Placing the staircase and rebuilding the floor were originally written directly into the application bootstrap, including the same "find the furthest floor tile" search copied out twice. Those are game rules, so they now live in a Tier 2 `FloorManager` with tests of their own, and the search is a single method on `Level`.

The descent is also deferred by one frame. It is triggered from inside the player's own update, and destroying the player partway through its update left the loop working on a torn-down object — which threw, and because the exception escaped before the next frame was requested, it silently killed the entire game loop. The floor is now rebuilt after all entities have finished updating, and the loop catches and reports errors instead of dying on them.

## 3. Lessons Learned

The `window.audit` object was originally typed as `any` to avoid fighting strict TypeScript over a debug utility. That was a false economy: the audit toolkit is the PM's only way to verify features, so it deserves the same type safety as the game. It now has a declared interface, which means a renamed or deleted command is a compile error rather than a runtime surprise.

**"Wipes the current floor" was not actually true.** Descending regenerated the map grid but never touched the entity list, so anything spawned on a previous floor survived every descent. Combined with removal never destroying what it removed, the heap grew about 1.6 MB per floor — roughly 32 MB across twenty descents, in a game whose core loop is descending forever. `FloorManager` now clears the entire entity set before rebuilding, and measured across twenty-five descents the heap stays flat.

**A test asserted the wrong thing.** The regeneration test checked `expect(level.grid).not.toBe(oldGrid)` — that a new object had been allocated, not that the map had changed. It would have passed against a `regenerate()` that produced an identical map, or an empty one. It now compares contents.

## 4. Effortless Audit Toolkit

**Audit Steps:**

1. Launch the local dev server (`npm run dev`).
2. Open the browser console (Press F12).
3. Type: `window.audit.spawnTestSquare()` and hit Enter — a spinning red square appears beside you. This is a marker to prove the floor really gets wiped.
4. Type: `window.audit.teleportToStairs()` and hit Enter to jump straight to the staircase.
5. Press the 'E' key.
6. Verify the floor regenerates into a completely new layout, you are placed at its centre, and a new staircase is far away.
7. Verify the red square is gone — the previous floor was wiped, not merely covered up.
8. Type `window.audit.getFloorStats()` and check that `depth` has increased.
9. Repeat steps 4-5 a dozen times. The game should stay responsive throughout, with no errors in the console.
