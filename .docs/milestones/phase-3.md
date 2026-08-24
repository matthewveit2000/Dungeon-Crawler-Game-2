# Milestone: EPIC 1: Engine Foundation and Application Boot / Phase 3: The Fixed-Timestep Game Loop

## 1. Executive Summary

We have built the heartbeat of the game engine. Instead of relying on a standard timer, the game now perfectly synchronizes with the monitor's refresh rate, making animations smooth. It accurately calculates the time between each frame so that regardless of computer performance, in-game speed and calculations like movement remain flawlessly consistent.

## 2. Technical Decisions & Architecture

Implemented the Game Loop module in Tier 1 (Engine). We decided to leverage the browser's native `requestAnimationFrame` method combined with `performance.now()` calculations to track exact delta time (time passed since the last frame) instead of standard JS intervals. The game logic will receive these delta values to advance physics safely and consistently.

## 3. Lessons Learned

During Test-Driven Development (TDD), we learned that utilizing Vitest's `vi.useFakeTimers()` in combination with `requestAnimationFrame` can cause simulated time not to automatically tick forward properly when tracking FPS, making mathematical test verifications difficult. We opted to manually trigger loops for deterministic TDD coverage over the delta time distribution math.

## 4. Effortless Audit Toolkit

**Audit Steps:**

1. Launch the local dev server (`npm run dev`).
2. Open the browser console (Press F12).
3. Type: `window.audit.getFPS()` and hit Enter.
4. Wait 1 second after page load before running, then verify that the command outputs a number representing a stable framerate (e.g., around 60).