# Dungeon Crawler Engine

Welcome to the Dungeon Crawler Engine, a high-performance, top-down 2D roguelike game built for the web. This project utilizes TypeScript, Vite, and the PixiJS WebGL rendering engine to deliver a highly scalable, procedurally generated action-RPG experience.

## High-Level Project Summary

The objective of the game is survival against an unrelenting clock. Players are dropped into massive, infinite-feeling procedurally generated floors. They have exactly 5 minutes to explore, defeat enemies, acquire statistically scaled loot, level up their attributes and skills, and locate a hidden staircase to descend to the next floor. If the global timer reaches exactly 0:00, the player dies instantly, losing all progress. Survival requires mastering combat, navigating safe zones (Cities), and overcoming locked Boss Arenas guarding high-tier loot.

## Architectural Overview

To ensure the game can scale infinitely without collapsing under technical debt, the repository enforces a strict Three-Tiered Architecture:

- **Tier 1 (Engine):** The technological foundation. Handles WebGL rendering, the fixed-timestep game loop, input capture, and asset loading.
- **Tier 2 (Modules):** The systemic logic. Handles hitbox detection, the 5-minute timer math, procedural generation algorithms, and AI behaviors.
- **Tier 3 (Packs):** The raw content data. Defines enemy base stats, weapon damage models, boss encounter rules, and drop-rate weighting.

By keeping these layers completely isolated, developers can easily add hundreds of new weapons or enemies simply by adding JSON data to Tier 3, without ever touching the core game code.

## Getting Started (For Human PM Auditing)

This project is orchestrated autonomously by an AI agent, but manual auditing is required for every feature delivery. To run the game locally:

1. **Requirements:** Ensure you have Node.js (v20 or higher) installed on your system.
2. **Install Dependencies:** Open your terminal in the repository root and run npm install.
3. **Launch the Engine:** Run npm run dev. This will start the Vite development server.
4. **Play:** Open your browser and navigate to http://localhost:5173.

## Testing Environment

The engine is built strictly using Test-Driven Development (TDD). To audit the health of the codebase:

| Command | What it does |
|---|---|
| `npm run verify` | The full gate: typecheck, tests, production build. Run this before every PR. |
| `npm test` | Runs the automated test suite once and exits. |
| `npm run test:watch` | Re-runs tests as you edit. |
| `npm run test:ui` | Opens the visual testing dashboard in your browser. |
| `npm run test:coverage` | Reports how much of the code the tests exercise. |
| `npm run typecheck` | Checks types without producing a build. |
| `npm run format` | Formats the code. |

The same checks run automatically on GitHub for every push and pull request. **A pull request with a failing check must not be merged** — see `AGENTS.md` §6.

## The Audit Toolkit

The game is playable the moment the page loads. For hands-on verification, open the browser console (F12) and use `window.audit`:

| Command | What it does |
|---|---|
| `window.audit.zoomOutMap()` | Shows or hides a map of the whole floor you are on. |
| `window.audit.teleportToStairs()` | Jumps you to the staircase. Press E to descend. |
| `window.audit.getFloorStats()` | Reports the floor's size, how much is walkable, and how far the stairs are. |
| `window.audit.setSeed(1234)` | Rebuilds the run from a seed. The same seed always builds the same floor. |
| `window.audit.getSeed()` | Reports the current seed. |
| `window.audit.spawnPlayer()` | Rebuilds the floor from scratch. |
| `window.audit.spawnTestSquare()` | Drops a spinning marker beside you. |
| `window.audit.getFPS()` | Reports the current frame rate. |
| `window.audit.getRendererDimensions()` | Reports the canvas size. |
| `window.audit.logInputs = true` | Logs every keystroke and mouse movement. |

## Art Direction

The game is pixel art at **32 x 32 pixels per sprite** — one sprite fills exactly one floor tile, placed at 1:1 with no scaling. The camera runs at a whole-number zoom, 2x by default, so a typical window shows about 20 tiles across. 32 x 32 is the resolution most freely licensed pixel art is drawn at, which lets the project draw on an existing asset library rather than commissioning every sprite.

`.docs/ART_GUIDE.md` is the full specification for anyone producing art. The resolution is stated once in `src/packs/World.json` and enforced by both the test suite and CI, so the documentation cannot drift away from the build.

## Tuning the Game Without Touching Code

Everything tunable lives as data in `src/packs/`:

- **`World.json`** — sprite resolution, floor dimensions, tile size, how much cave gets carved, corridor width, colours.
- **`Player.json`** — movement speed, size, colour, how close you must be to use the stairs.
- **`Controls.json`** — key bindings.
- **`Interactables.json`** — the staircase.
- **`Debug.json`** — the test marker.

*Note: Direct human commits to the main branch should be avoided. The autonomous Technical Lead manages the repository via Pull Requests.*