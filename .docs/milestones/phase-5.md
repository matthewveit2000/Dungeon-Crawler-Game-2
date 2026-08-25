# Milestone: EPIC 2: Entity Architecture and Kinematics / Phase 5: The Entity Manager Scaffold

> Reformatted during the Phase 11.5 Hardening Checkpoint to match `TEMPLATE.md`, and updated to cover the lifecycle work done in that phase.

## 1. Executive Summary

We built the system that keeps track of every living thing in the game world — the player, and later enemies, loot and vendors. It knows what exists, tells each thing to take its turn every frame, and cleans up properly when something is removed.

## 2. Technical Decisions & Architecture

Two pieces in Tier 1 (Engine):

- **`Entity`** is the base every game object inherits from. It owns its position, its collision box, and its on-screen appearance, and it guarantees those stay in step — moving an entity always moves what you see.
- **`EntityManager`** holds the list of active entities, adds them to and removes them from the screen, and drives their updates each frame.

Entities describe their appearance as plain data (a size and a colour). A small Tier 1 helper turns that description into something PixiJS can draw, which is what keeps the game-rules layer free of rendering code.

## 3. Lessons Learned

The first version removed entities from the screen but never released them. Everything a removed entity owned — its shape, its graphics memory — stayed allocated. Since the core loop of this game is descending floors forever, that leak grew with every floor: roughly 1.6 MB per descent, measured at about 32 MB across twenty floors.

Worse, there was no way to remove *everything* at once, so Phase 11's promise to "wipe the current floor" was never actually kept. A test object spawned on the first floor survived every descent after it.

Both are fixed. Removal now destroys the entity, `clear()` wipes the whole set, and destruction is idempotent so removing something twice is harmless. Across twenty-five descents the heap now stays flat.

One further trap: an entity can trigger something that destroys it partway through its own update — the player using the stairs does exactly this. Anything touching an entity after that point must tolerate it being gone. Position syncing now no-ops on a destroyed entity, and floor rebuilds are deferred until after all entities have finished updating.

## 4. Effortless Audit Toolkit

**Audit Steps:**

1. Launch the local dev server (`npm run dev`).
2. Open the browser console (press F12).
3. Type `window.audit.spawnTestSquare()` and press Enter.
4. **Verification:** A spinning red square appears just to the right of your character, proving an entity was created, drawn, and is updating every frame.
5. Walk to the staircase and press E to descend.
6. **Verification:** The red square is gone. Descending wipes the floor completely, rather than leaving the previous floor's contents behind.
