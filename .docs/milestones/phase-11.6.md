# Milestone: EPIC 3 / Phase 11.6: Art Resolution Decision & Rescale

## 1. Executive Summary

We have settled how detailed the game's artwork will be, and rescaled the world to match it before any art gets drawn.

**Every sprite will be 64 x 64 pixels** — one sprite fills exactly one floor tile. This is the high-fidelity end of pixel art: enough room to draw a character whose armour and weapon are clearly readable, which matters in a game built around finding better gear. At this size a screen shows about 20 tiles across, which is a good tactical view — wide enough to see an enemy coming, close enough that the character reads as a character.

Nothing about how the game plays has changed. The world is the same number of tiles, the player still covers the same ground per second, and the staircase is the same distance away in seconds. Only the units changed: tiles went from 40 pixels to 64, and player speed went from 200 to 320 so the pace stays identical.

## 2. Technical Decisions & Architecture

The resolution is stated exactly once, as `spriteResolution` in `src/packs/World.json`, with `tileSize` held equal to it so that art lands at 1:1 with no scaling. Fractional scaling is what turns crisp pixel art to mush, so the two values diverging is treated as a build failure rather than a judgement call.

Values that follow from tile size were rescaled with it: player speed 200 to 320 (preserving 5 tiles per second), the staircase to a full 64 x 64 tile, and the interaction radius from 60 to 96 (one and a half tiles, as before).

Corridors went back to a single tile. Phase 11.5 had widened them to three, because at 40-pixel tiles a one-tile corridor was tight. At 64-pixel tiles it is 64 pixels against a 16-pixel collision box — four times the room needed — so the extra width bought nothing and cost a great deal: at the closer framing the wide brush left the screen filled with featureless open floor and no landmarks to navigate by. Reverting it restored visible cave structure to every view. Before making the change, the collision resolver was run over whole generated maps in eight directions; single-tile corridors came back 100% reachable, and a simulated player traversed one end to end without ever touching a wall.

The player's collision box stays a quarter of a tile — now 16 x 16 against a 64 x 64 sprite. Sprite size and collision size are deliberately different: the box represents the character's feet, not their whole silhouette. A character that collided across the full width of their art could not walk through gaps their art suggests they should fit, which reads as the game being unresponsive.

Three new documents and guards keep this from drifting:

- **`.docs/ART_GUIDE.md`** is the specification for anyone drawing art — canvas size, alignment, palette, the sprite-versus-collision distinction, and what it would cost to change the number later.
- **`src/packs/packs.test.ts`** asserts the contracts as tests, so the documentation cannot quietly diverge from the build.
- **`scripts/check-architecture.mjs`** fails CI if tile size and sprite resolution diverge, or if the resolution is restated as a literal anywhere in the source.

The rendering work this implies — nearest-neighbour sampling, whole-number camera zoom, and snapping the camera to whole pixels — is real engine work and is scheduled as its own epic (**Epic 4.5, Phases 16 to 19**) rather than being bundled here. Until those phases land the game draws flat coloured rectangles at the correct dimensions, which is what it did before.

## 3. Lessons Learned

**The test suite was quietly coupled to the old tile size.** Changing 40 to 64 broke nine tests, all of them fixtures written as raw pixel coordinates — `{ x: 60, y: 60 }` meaning "the centre of tile (1,1)" only if a tile happens to be 40 pixels. The tests were not wrong about behaviour; they had encoded a constant that was never theirs to encode.

The failure was loud this time, which is the good case. The dangerous version is a fixture that still passes after a scale change while no longer testing the situation it describes — a collision test whose "player against a wall" position has quietly become "player in open floor" would go on passing forever while checking nothing. Every fixture now derives its coordinates from `level.tileSize`, and CI rejects new ones that do not.

**A stale build cache made the first diagnosis wrong.** After changing the pack, tests failed with values that implied a 40-pixel tile even though the file plainly said 64. The cause was Vite's cache in `node_modules/.vite` holding the old JSON. Worth remembering: when a change to a data file appears to have no effect, clear the cache before concluding anything about the code.

**Bulk text replacement fails silently.** Several edits to a test file were applied with a find-and-replace that found nothing and reported nothing, so a run that looked like it should pass failed on the untouched originals. Any scripted edit needs its result verified rather than assumed.

**A change of scale can be correct in every test and still wrong on screen.** With the rescale done and all 144 tests passing, the running game showed a screen of featureless grey — the player standing in the middle of an enormous open cavern with no wall in sight. Nothing was broken; the cave simply had far too much open floor to read well at the closer framing. No unit test could have caught it, because it is a question of how the game looks rather than how it behaves. Opening the browser did.

## 4. Effortless Audit Toolkit

**Audit Steps:**

1. Launch the local dev server (`npm run dev`) and open http://localhost:5173.
2. **The view is closer.** Compared with before, tiles are visibly larger and you see about 20 across the screen rather than 32. This is the framing real artwork will be drawn for.
3. **Movement feels the same.** Walk around. The character should cross the same number of tiles per second as it did previously — the change is one of scale, not pace.
4. **The world is the same size in play terms.** Type `window.audit.getFloorStats()` in the console (F12). `stairsSecondsAway` should be roughly 20 seconds, the same as before.
5. **The cave has structure.** Walls should be visible from almost anywhere on the floor, giving you landmarks to navigate by rather than an unbroken expanse of ground.
6. **Corridors are still comfortable.** Run diagonally into wall corners from several angles. You should slide along them and never become stuck. Follow a narrow passage to its end — you should never have to line yourself up carefully to enter one.
7. **The staircase is one full tile.** Type `window.audit.teleportToStairs()` and look at the blue square — it exactly fills one floor tile.
8. **The macro map still reads.** Type `window.audit.zoomOutMap()` and confirm the whole floor appears; type it again to hide it.
9. **The contracts are enforced.** In a terminal, run `npm run verify`. All checks, including the new Tier 3 pack contracts and the architecture guard, should pass.
10. Read `.docs/ART_GUIDE.md` — it is the brief anyone drawing art for this game should work from.
