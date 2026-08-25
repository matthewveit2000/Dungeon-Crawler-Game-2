# Milestone: EPIC 3 / Phase 11.7: Art Resolution Retarget to 32 x 32

## 1. Executive Summary

We have halved the game's art resolution, from 64 x 64 pixels per sprite to **32 x 32**, to make the project's art affordable.

The original 64 x 64 decision (Phase 11.6) was made on artistic grounds: more pixels mean more readable armour and weapons, which matters in a game built around finding better gear. That reasoning still holds. What it did not account for is supply. Almost all freely licensed pixel art — including the Dungeon Crawl Stone Soup tileset, thousands of public-domain sprites drawn for exactly this genre — is authored at 32 x 32. At 64 x 64 the project was committed to commissioning or drawing nearly every asset itself. At 32 x 32 it can draw on a library that already covers most of what the combat and loot epics need.

**Nothing about how the game plays has changed.** The world is the same 160 x 160 tiles, the player still crosses five tiles per second, the staircase is the same distance away in seconds, and the interaction reach is the same tile and a half. Only the units changed.

**One visible difference, and it is temporary.** Camera zoom does not exist yet — it is built in Phase 16 — so the game currently draws at 1x and everything on screen appears at half its former size, with roughly four times as much map visible. Phase 16 applies the 2x default zoom declared in `World.json`, which restores exactly the framing the game had before: about 20 tiles across a standard window.

## 2. Technical Decisions & Architecture

The change touched Tier 3 data and documentation. No Tier 1 or Tier 2 logic was modified, because none of it holds the resolution — it reads it.

Values that follow from tile size were rescaled with it, preserving every ratio that describes how the game feels:

| Value | Before | After | Preserved as |
|---|---|---|---|
| `spriteResolution` / `tileSize` | 64 | 32 | one sprite, one tile |
| Player `speed` | 320 | 160 | 5 tiles per second |
| Player `interactRadius` | 96 | 48 | 1.5 tiles |
| Staircase size | 64 x 64 | 32 x 32 | one full tile |
| Debug test square | 50 | 25 | ~0.78 of a tile |
| Collision box (`sizeRatio` 0.25) | 16 x 16 | 8 x 8 | a quarter of the sprite |

`sizeRatio` itself was deliberately **not** touched. It is a ratio, so it rescales on its own, and 0.25 x 32 is 8 — still a whole number of pixels, which `packs.test.ts` requires so collision edges land on pixel boundaries.

A new Tier 3 key, `defaultZoom: 2`, records the intended camera zoom. It is declared now rather than in Phase 16 because the architecture forbids magic numbers outside Tier 3, and because the screen-coverage figures in the specification documents are meaningless without it. `packs.test.ts` asserts it is a whole number; Phase 16 will consume it.

`scripts/check-architecture.mjs` guards against the resolution being restated as a literal anywhere in `src`. That check contained the literal `64` itself, which would have left it silently guarding the wrong number after this change. It now builds its pattern from `World.json`, so it cannot drift again.

## 3. Lessons Learned

**The discipline paid for itself.** Changing the resolution broke **zero tests**. All 155 passed without a single fixture being touched. Phase 11.6 changed the same number and broke nine tests, every one of them a fixture written as a raw pixel coordinate. The rule adopted in response — fixtures derive from `level.tileSize`, never from a pixel literal, enforced by `check-architecture.mjs` — is the entire reason this phase was a data change rather than a test-rewriting exercise. The cost of that rule was paid once; this is the second time it has been collected on.

**A guard containing the constant it guards is not a guard.** The architecture check existed to stop the resolution being hardcoded, and was itself hardcoded. It would have passed happily while checking for a number the project no longer used. Anything that asserts a value should derive it from the same source of truth the code does.

**Resolution is an art-supply decision as much as an art-direction one.** The Phase 11.6 write-up weighed fidelity against drawing time per asset. The question it did not ask was whether assets would be drawn at all or sourced. For a project of this size, what already exists under a permissive licence is a first-class input to the decision, and it should have been weighed the first time.

**Public repositories redistribute their assets.** The repository is public and the game deploys publicly, so committing art distributes it. That rules out packs licensed "free to use, do not redistribute", which is a large share of the free ecosystem and includes several that otherwise fit this genre well. `ART_GUIDE.md` section 6 now states the licence bar and requires every asset to be recorded in `CREDITS.md`.

## 4. Effortless Audit Toolkit

**Audit Steps:**

1. Launch the local dev server (`npm run dev`) and open the browser console (F12).
2. **Expect the view to look zoomed out.** Sprites are half their former size and much more of the cave is visible. This is the known interim state described above; Phase 16 restores the framing.
3. Walk around with WASD. **The pace should feel exactly as it did before** — the character still covers five tiles every second. It is moving half as many pixels per second across tiles that are half as large.
4. Type `window.audit.getFloorStats()` and confirm the grid is still 160 x 160 and the floor is still fully connected.
5. Type `window.audit.spawnTestSquare()`. A spinning red square appears exactly two tiles to the right of the player — confirming the debug marker still positions itself from the tile size rather than a stale pixel figure.
6. Type `window.audit.zoomOutMap()`. The macro map is unchanged: it renders in screen pixels and is deliberately independent of world tile size. Run it again to hide it.
7. Type `window.audit.teleportToStairs()`, then press E to interact. A new floor loads normally, confirming the staircase is still exactly one tile and still within interaction reach.
8. Confirm the countdown still starts at 5:00 and ticks normally.

**Expected result:** everything behaves identically to before the change, drawn at half scale.
