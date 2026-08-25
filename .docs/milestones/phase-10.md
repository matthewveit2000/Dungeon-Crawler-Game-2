# Milestone: Epic 3 / Phase 10: Tile Rendering & AABB Collision

## 1. Executive Summary

Players can now explore a massive, procedurally generated dungeon floor. The world is physically solid, meaning the player will smoothly bump into and slide along walls without getting stuck or walking outside the boundaries of the map. The game view now properly tracks the player across this generated environment.

## 2. Technical Decisions & Architecture

Implemented the `Level` module in Tier 2, which runs the random walk over a 1D-backed spatial grid and answers collision questions about the result. Player movement calculates a next position and checks it against the grid before committing. An epsilon (0.001) subtraction on the far edges of the bounding box ensures clean sliding along exact tile boundaries without false positive stops.

**Restructured in Phase 11.5.** As delivered, `Level` also drew itself with PixiJS, which put rendering technology inside the game-rules tier. Drawing now lives in a Tier 1 `TileRenderer` that is handed a grid and a colour palette and knows nothing about dungeons; `Level` holds no PixiJS objects at all and can be tested without a renderer. The renderer also skips solid rock entirely (it is the background colour anyway) and merges runs of adjacent floor tiles into single rectangles, which cuts the geometry substantially.

Collision resolution moved into a shared `Movement` module so that enemies and projectiles will use exactly the same rules as the player rather than each re-implementing them.

## 3. Lessons Learned

When implementing exact bounding box checks in a tile-based grid, it is critical to account for floating-point boundaries. If a character's right edge falls exactly on X=80, the tile beginning at X=80 is not yet occupied. Without subtracting a tiny decimal before calculating the grid tile index via `Math.floor()`, the system would incorrectly report a collision with that tile.

**Two collision defects shipped in this phase and were fixed in Phase 11.5.**

*Walls were passable during frame stutters.* Only the destination of a move was tested, never the path to it. A measured 600 ms stall produced a frame carrying 0.624 seconds, in which the player would travel 125 pixels — through walls 40 pixels thick. Movement is now broken into substeps no longer than half a tile, so no single check can skip over anything solid.

*Diagonal movement cut corners, and cutting a corner ended the run.* Each axis was tested against the original position, so at an inside corner both axes passed individually while the corner tile between them was solid. The player ended up embedded in a wall — and from inside a wall every direction out is also blocked, so they were stuck permanently with no key able to free them. The vertical axis is now tested against the already-resolved horizontal position, which closes the gap. As a backstop, a body that somehow ends up inside geometry is allowed to move freely so it can always walk back out.

That second defect is worth dwelling on, because the symptom was misread. It presented as "the character cannot get around the map", and the response was to shrink the character — from 40 pixels to 30, then 20, then 10, across four commits in a later PR, each described as making it fit through hallways. The character had always fitted; a 10-pixel body in a 40-pixel corridor has three tiles of slack. Shrinking it changed nothing except how small it looked. The fix was in the collision routine all along.

## 4. Effortless Audit Toolkit

**Audit Steps:**

1. Launch the local dev server (`npm run dev`).
2. Open the browser console (Press F12).
3. The game is playable immediately; no console command is needed.
4. Use the WASD or arrow keys to explore the map.
5. Verify your movement is physically blocked by the dark wall tiles, and that you slide along a wall rather than stopping dead when you push into it at an angle.
6. Run diagonally into the inside corner of a wall, repeatedly and from several directions. Verify you never pass into the wall and never become stuck.