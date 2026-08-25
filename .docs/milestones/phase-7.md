# Milestone: Epic 2 / Phase 7: Camera Tracking Logic

## 1. Executive Summary

Players now have a dynamic camera that smoothly follows their character around the game world! Instead of the character just moving off the screen, the game world itself moves in the background to ensure the player character remains perfectly centered at all times, making navigation much more intuitive and expansive.

## 2. Technical Decisions & Architecture

Implemented the Camera module in Tier 1 (Engine). The camera achieves the centering effect by mathematically setting the PixiJS stage's pivot to the target entity's logical coordinates, and then anchoring that pivot to the absolute center of the renderer screen. The logic hooks into the main game loop, ensuring the camera updates every frame seamlessly inverse to the player's movement.

## 3. Lessons Learned

PixiJS graphics required modern v8 methods (`moveTo`, `lineTo`, `stroke()`) rather than the deprecated `beginFill` API when we drew a temporary background grid to visualize camera movement. Handled resizing events gracefully by updating the camera tracking bounds dynamically so the player stays centered even if the browser window changes dimensions.

**Updated in Phase 11.5.** That temporary grid was replaced by real dungeon tiles in Phase 10, but this document went on telling the PM to look for it — an audit instruction that could no longer be followed. Milestone documents are read months after they are written; when a later phase removes something an earlier audit step depends on, that step has to be updated in the same PR.

This phase also introduced a subtler problem. Moving the world under a camera means anything positioned in world coordinates scrolls with it — which is exactly why the Phase 9 macro map disappeared. The renderer now keeps two separate layers: a world layer the camera moves, and a screen-fixed layer for overlays and, later, the HUD.

## 4. Effortless Audit Toolkit

**Audit Steps:**

1. Launch the local dev server (`npm run dev`).
2. Open the browser console (Press F12).
3. The game is already playable on load; no console command is needed.
4. Move around using the WASD or arrow keys.
5. Verify that the player character stays perfectly in the middle of the screen while the dungeon floor moves beneath them.
6. Resize the browser window and move again — the character should still be centred.