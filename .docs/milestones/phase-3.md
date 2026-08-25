# Milestone: EPIC 1: Engine Foundation and Application Boot / Phase 3: The Fixed-Timestep Game Loop

## 1. Executive Summary

We have built the heartbeat of the game engine. Instead of relying on a standard timer, the game now perfectly synchronizes with the monitor's refresh rate, making animations smooth. It accurately calculates the time between each frame so that regardless of computer performance, in-game speed and calculations like movement remain flawlessly consistent.

## 2. Technical Decisions & Architecture

Implemented the Game Loop module in Tier 1 (Engine), driven by the browser's native `requestAnimationFrame` rather than a standard JavaScript interval.

**Corrected in Phase 11.5.** As originally delivered this was *not* a fixed-timestep loop, despite the phase name. It passed each frame's raw elapsed time straight through to the game, which means the simulation advanced by a different amount every frame. The loop now accumulates real time and releases it in identical 1/60-second slices, so movement, timers and collisions produce the same result on any machine at any frame rate. Two guards protect it: a single frame can contribute at most a quarter of a second, and the number of slices per frame is capped so a slow machine drops time instead of falling further behind.

## 3. Lessons Learned

During Test-Driven Development (TDD), we learned that Vitest's `vi.useFakeTimers()` combined with `requestAnimationFrame` does not tick simulated time forward reliably, making mathematical verification difficult. We opted to drive the loop manually for deterministic coverage.

**The deeper lesson, recorded in Phase 11.5.** The original test reached into the loop's private fields and asserted that the delta time *varied* between 0.015 and 0.018 seconds. That assertion did not merely fail to catch the missing fixed timestep — it wrote the defect into the test suite as the expected behaviour, so any later attempt to implement the phase correctly would have broken a passing test.

Two things went wrong and both are now rules in `AGENTS.md`. A test that asserts what the code already does, rather than what the specification requires, cannot detect the gap between them. And a milestone document must not quietly redefine its own phase's objective: where the implementation departs from `ROADMAP.md`, that is a decision to raise, not a wording to soften.

The loop is now driven through its public interface, with a seam for supplying the start time, and the tests assert a constant step, correct handling of a suspended tab, and that the loop survives an error thrown by game code.

## 4. Effortless Audit Toolkit

**Audit Steps:**

1. Launch the local dev server (`npm run dev`).
2. Open the browser console (Press F12).
3. Type: `window.audit.getFPS()` and hit Enter.
4. Wait 1 second after page load before running, then verify that the command outputs a number representing a stable framerate (e.g., around 60).