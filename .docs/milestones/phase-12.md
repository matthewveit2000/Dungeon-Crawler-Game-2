# Milestone: EPIC 4 / Phase 12: Delta-Time Countdown Logic

## 1. Executive Summary

A global countdown timer starting at 5 minutes has been implemented and is visible on the screen. The timer ticks down in real-time, completely independently from the system clock, ensuring that the game's simulation and visual countdown remain accurate across all framerates. This lays the groundwork for the 5-minute permadeath run mechanic.

## 2. Technical Decisions & Architecture

The `Timer` logic was implemented in Tier 2 (`src/modules/Timer.ts`) and is updated every frame by the `GameLoop` using the engine's constant delta time. The visual representation of the timer was implemented via a new `TimerOverlay` class in Tier 1 (`src/engine/TimerOverlay.ts`), which is a PixiJS Text object anchored to the top center of the screen.

The `window.audit` object was updated with a `setTimer(seconds: number)` method to allow manipulating the time directly for future testing (e.g. instant death triggers).

## 3. Lessons Learned

PixiJS text positioning works best using `anchor.set(0.5, 0)` combined with dynamic updating of `x` based on `window.innerWidth` via the resize listener. This guarantees the timer stays perfectly centered even when the window is resized. A ceiling math function is used for displaying remaining time so that "0:00" is strictly displayed when the time hits zero, rather than when fractional seconds are remaining.

## 4. Effortless Audit Toolkit

**Audit Steps:**

1. Launch the local dev server (`npm run dev`).
2. Observe the timer text "5:00" centered at the top of the screen.
3. Observe the timer ticking down "4:59", "4:58", etc. accurately in real time.
4. Open the browser console (Press F12).
5. Type: `window.audit.setTimer(10)` and hit Enter.
6. Verify that the timer text instantly changes to "0:10" and ticks down to "0:00" and then stops ticking.