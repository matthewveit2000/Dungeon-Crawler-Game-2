# Phase 4: Input State Manager

## Summary
The game engine can now track the player's keyboard and mouse inputs in real-time. This system listens for when keys (like WASD) are pressed down or released, and it continuously monitors the mouse's position and button clicks. This is a crucial foundational step that will allow players to control their character and interact with the game world in upcoming phases.

## Technical Decisions
- A standalone `InputManager` class was created within the Tier 1 (Engine) layer to strictly handle browser events for the keyboard and mouse.
- Input states (active keys, mouse coordinates, and mouse button presses) are stored in an easily accessible state object, updated via standard browser event listeners (`keydown`, `keyup`, `mousemove`, `mousedown`, `mouseup`).
- The native browser context menu (right-click menu) was disabled to allow the right mouse button to be used seamlessly in-game without interruptions.

## Audit Instructions
To verify the input system is working correctly:
1. Open the game in your browser using `npm run dev`.
2. Open the browser's developer console (F12 or Right Click -> Inspect -> Console).
3. Type `window.audit.logInputs = true;` into the console and press Enter.
4. The console will begin rapidly logging the current input state.
5. Press keys (e.g., 'W', 'A', 'S', 'D') and click/move your mouse. You will see the logged state dynamically reflect these inputs.
6. To stop logging, type `window.audit.logInputs = false;` in the console.

## Lessons Learned
- Creating a robust interface for inputs ensures that the game loop logic won't be cluttered with event listeners when entities are implemented. The clean `getState()` method allows for easy dependency injection to other systems later on.