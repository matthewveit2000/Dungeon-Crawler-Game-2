# Milestone: EPIC 3 / Phase 11: The Exit Staircase Mechanic

## 1. Executive Summary

Players can now interact with a staircase placed far away from their starting position on the floor. When they stand near the staircase and press the 'E' key, the current floor is wiped clean, and a completely new, procedurally generated floor is created, allowing them to progress deeper into the dungeon endlessly.

## 2. Technical Decisions & Architecture

Implemented the `Staircase` entity, which reads its visual properties from a newly introduced `Interactables.json` data pack in Tier 3. The `Level` module (Tier 2) was enhanced with a `regenerate()` method that destroys the old map grid and generates a brand new one using the existing random walk algorithm. The distance-checking interaction logic was added to the player entity to only trigger the floor reset when within range of the stairs.

## 3. Lessons Learned

No major roadblocks were encountered. It was discovered that the `teleportToStairs` function required typing it as `any` in the global `Window` interface within `main.ts` due to multiple dynamic properties added on the fly during bootstrap, rather than fighting strict TypeScript definitions for a debug utility. A mock simulation for interaction key (`e`) required setting other missing `InputManager` properties like `mouse` in test files.

## 4. Effortless Audit Toolkit

**Audit Steps:**

1. Launch the local dev server (`npm run dev`).
2. Open the browser console (Press F12).
3. Type: `window.audit.spawnPlayer()` and hit Enter to spawn the player and generate the first map.
4. Type: `window.audit.teleportToStairs()` and hit Enter to immediately jump the player to the staircase.
5. Press the 'E' key on your keyboard.
6. Verify that the floor visually regenerates into a new layout, the player is moved to a new center position, and a new staircase is spawned far away.
