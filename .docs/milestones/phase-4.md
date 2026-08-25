# Milestone: EPIC 1: Engine Foundation and Application Boot / Phase 4: Input State Manager

> Reformatted during the Phase 11.5 Hardening Checkpoint to match `TEMPLATE.md`, and updated to cover the edge-state tracking added in that phase.

## 1. Executive Summary

The engine now tracks what the player is doing with their keyboard and mouse. It knows which keys are held down, where the mouse is, which buttons are pressed, and — importantly — which keys were *just* tapped, even if the tap was faster than a single frame of the game.

## 2. Technical Decisions & Architecture

`InputManager` sits in Tier 1 (Engine) and is the only place in the codebase that touches browser input events. It exposes a single `getState()` method, so any system that needs input receives a plain snapshot rather than wiring up its own listeners.

The state has two halves, and the distinction matters:

- **Held keys** answer "is the player pressing this right now?" — the right question for movement.
- **Just-pressed keys** answer "did the player tap this since the last frame?" — the right question for anything that should happen once per press, such as using the stairs, attacking, or opening a menu.

The browser's right-click menu is suppressed so the right mouse button can be used in-game.

## 3. Lessons Learned

The original implementation only tracked held keys, and each system did its own edge detection by remembering whether the key had been held on the previous frame. That approach loses any press that begins and ends between two frames. It is not a theoretical concern: it was reproduced reliably during Phase 11.5, where quick taps of the interact key were dropped and the staircase simply failed to respond.

Moving edge detection into the input layer fixed it in one place for every future consumer, and removed the duplicated bookkeeping from the player. The cost is that the game loop must call `endFrame()` once per frame to clear the edge state, after everything that reads input has run.

## 4. Effortless Audit Toolkit

**Audit Steps:**

1. Launch the local dev server (`npm run dev`).
2. Open the browser console (press F12).
3. Type `window.audit.logInputs = true;` and press Enter.
4. The console begins logging the input state every frame.
5. Press W, A, S and D, move the mouse, and click. The logged state should reflect each action as you do it.
6. Tap the E key as fast as you can. Every tap should appear in `justPressed`, even the fastest ones.
7. Type `window.audit.logInputs = false;` to stop logging.
