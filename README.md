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

- To run the automated test suite in the console: npm run test
- To open the visual testing dashboard in your browser: npm run test:ui

*Note: Direct human commits to the main branch should be avoided. The autonomous Technical Lead manages the repository via Pull Requests.*