# Milestone: EPIC 2: Entity Architecture and Kinematics / Phase 6: Player Entity & 2D Movement

## 1. Executive Summary

We've added a controllable player character to the engine. When the player runs the game, they can now spawn a player block and use the W, A, S, D keys to move around the screen smoothly and fluidly.

## 2. Technical Decisions & Architecture

Implemented the `Player` entity within Tier 2 (Modules), extending the foundational `Entity` class from Tier 1. The player entity binds the `InputManager` states to velocity, applying movement over delta time to ensure consistent movement speed regardless of the frame rate. Diagonal movement is normalized so the player does not travel faster when moving in two directions at once.

## 3. Lessons Learned

PixiJS graphics required updates (`beginFill` and `drawRect` to `fill` and `rect`) to clear deprecation warnings under v8.0.0. The test environment successfully utilized Vitest and a temporary Application instance to validate movement assertions without causing test pollution.

**Corrected in Phase 11.5.** That migration was reported as complete but was only done in the files this phase touched; `TestSquare` was left on the old calls and kept logging three deprecation warnings every time it was spawned. A claim that a codebase-wide cleanup is finished has to be checked across the codebase, not across the diff. No Tier 2 module constructs PixiJS objects at all now, so the question cannot recur in the same form.

Two further defects in this phase's movement code were found in the Epic 1-3 audit and fixed in Phase 11.5:

- Collision tested only the destination of a move, so during any frame stutter the player passed straight through walls.
- The two axes were resolved against the original position rather than in sequence, which let the player clip diagonally into the inside corner of a wall — and once inside, every direction out was blocked too, ending the run.

Movement now lives in a shared `Movement` module with regression tests for both cases.

## 4. Effortless Audit Toolkit

**Audit Steps:**

1. Launch the local dev server (`npm run dev`).
2. Open the browser console (Press F12).
3. The game is already playable on load — no console command is needed. `window.audit.spawnPlayer()` rebuilds the floor if you want a fresh one.
4. Use the W, A, S, D keys or the arrow keys to test movement. Ensure the character moves smoothly and at the same speed diagonally as it does straight.
5. Hold two keys to run diagonally into the inside corner of a wall. Verify you slide along it and never become stuck.
