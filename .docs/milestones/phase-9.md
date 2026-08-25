# Milestone: EPIC 3 / Phase 9: Infinite-Feeling Random Walker Algorithm

## 1. Executive Summary

Players can now explore procedurally generated, massive, and seamless dungeon floors. Instead of feeling boxed into small rectangular rooms, the game produces sprawling caverns that appear infinite to the player, allowing for non-linear exploration.

## 2. Technical Decisions & Architecture

Implemented `MapGenerator` in Tier 2 (Modules). It utilizes a random walk algorithm to carve out contiguous floor tiles on the 1D-backed `MapGrid`. Because the walker only ever steps to an adjacent tile, every carved tile is connected to the start, so there can be no isolated pockets. The generator is independent of the engine rendering logic, adhering to the Three-Tier architecture.

**Extended in Phase 11.5.** Three changes:

- The generator now takes an injected seeded random number generator instead of calling the browser's randomness directly, so the same seed always builds the same floor. This makes reported problems reproducible and lets the tests assert on generated maps.
- The walker carves with a brush several tiles wide rather than a single tile. One-tile corridors are technically navigable but demand near-perfect alignment to enter, which made moving around feel far worse than it needed to.
- Floor parameters — grid size, step count, brush width, colours — moved to `src/packs/World.json`.

## 3. Lessons Learned

No major roadblocks were encountered during implementation. The lessons came later, in the Epic 1-3 audit.

**The connectivity test could never have failed.** A flood-fill confirmed every floor tile was reachable — but a single walker can only ever produce a connected region, so the assertion held by construction regardless of what the generator did. A test that cannot fail reports safety that does not exist. The suite now also runs the flood-fill against a deliberately disconnected map, proving the checker itself works.

**The PM verification broke and nobody noticed for two phases.** `window.audit.zoomOutMap()` worked when this phase shipped. Phase 7 then began moving the world under a camera, and because the macro map was positioned in world coordinates it started drawing roughly two thousand pixels off-screen the moment a player existed. It still logged "Macro-scale map generated and rendered to stage." to the console, so it looked like it was working. Two more phases shipped on top.

Three fixes came out of it. The overlay now lives on a screen-fixed layer the camera cannot move; it draws the floor the player is actually on, rather than generating a fresh unrelated map; and it is a toggle that releases its drawing when hidden, because each call used to leave behind a 40,000-rectangle drawing that was never freed — about 38 MB per call.

`scripts/check-audit-toolkit.mjs` now runs in CI and fails the build if any milestone document references an audit command that no longer exists.

## 4. Effortless Audit Toolkit

**Audit Steps:**

1. Launch the local dev server (`npm run dev`).
2. Open the browser console (Press F12).
3. Type: `window.audit.zoomOutMap()` and hit Enter.
4. Verify a macro-scale view of the whole floor appears, centred on a dark panel, showing a sprawling connected cave. This is the floor you are standing on, not a sample.
5. Type the same command again to hide it.
6. Type `window.audit.setSeed(1234)` and then `window.audit.zoomOutMap()`. Note the shape. Run both again — the map should be identical, because the same seed always builds the same floor.
7. Type `window.audit.getFloorStats()` to see the floor's size, how much of it is walkable, and how far away the staircase is.