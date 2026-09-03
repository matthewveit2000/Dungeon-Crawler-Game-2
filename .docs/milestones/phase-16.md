# Milestone: EPIC 4.5 / Phase 16: Pixel-Perfect Rendering Foundation

## 1. Executive Summary

We have upgraded the game's rendering foundation to guarantee that pixel art displays with razor-sharp clarity and zero visual distortion.

The game now boots up at its intended **2x camera zoom**, displaying approximately 20 tiles across standard screens (restoring the tactical view planned when retargeting to 32 x 32 pixel art). When the character moves through the dungeon, tile edges and character boundaries no longer crawl, shimmer, or blur. Furthermore, texture filtering has been set to nearest-neighbour, ensuring that when real sprite artwork is added in the next phase, pixels remain crisp rather than being smeared by bilinear smoothing.

## 2. Technical Decisions & Architecture

This phase focused entirely on Tier 1 (Engine) to prepare the rendering surface for incoming art assets:

- **Nearest-Neighbour Texture Sampling:** Configured `TextureStyle.defaultOptions.scaleMode = 'nearest'` at the engine initialization level in `src/engine/Renderer.ts`. Every texture loaded or created in PixiJS now automatically samples nearest-neighbour by default, preventing blurring on pixel art.
- **Integer Camera Zoom:** Added zoom management to `src/engine/Camera.ts`, reading the configured default (`defaultZoom: 2`) from `src/packs/World.json` during application boot. The camera strictly validates that zoom levels are integers $\ge 1$, rejecting non-integer values (such as 1.5x or 0.8x) that would cause subpixel seams and uneven pixel scaling.
- **Whole-Pixel Camera Snapping:** In `Camera.update()`, both the stage pivot (`stage.pivot.x`, `stage.pivot.y`) and stage screen position (`stage.position.x`, `stage.position.y`) are rounded to whole integers via `Math.round()`. This prevents camera positions from landing on subpixel boundaries during movement or on screens with odd pixel dimensions, eliminating the classic "pixel shimmer" effect when traversing the dungeon.
- **Audit Toolkit Integration:** Added `window.audit.getZoom()` and `window.audit.setZoom(zoom)` to the Effortless Audit Toolkit, guarded in CI by `scripts/check-audit-toolkit.mjs`.

## 3. Lessons Learned

- **Pixel art cannot tolerate subpixel offsets:** Even with nearest-neighbour filtering, allowing a virtual camera pivot to sit at fractional positions (e.g. `100.4`) causes tile edges on adjacent screen pixels to round inconsistently as the player moves, manifesting as visible shimmering and crawling tile borders. Rounding both the target pivot and the stage center to whole numbers completely eliminates this artifact.
- **Enforcing integer zoom in the engine:** Permitting fractional zoom levels produces uneven pixel sizes across the viewport (e.g., some pixels rendered 1px wide and others 2px wide). Throwing an explicit error on non-integer zoom protects the visual integrity of the game.
- **Bootstrap line discipline:** `src/main.ts` is strictly capped at 240 lines to prevent game rules from accumulating in bootstrap. By keeping toolkit methods concise and extracting logic cleanly into Tier 1/Tier 2 classes, the file remains comfortably within limits (238 lines).

## 4. Effortless Audit Toolkit

**Audit Steps:**

1. Launch the local dev server (`npm run dev`) and open http://localhost:5173.
2. **Tactical framing on load:** Observe that the view is now at 2x zoom (showing ~20 tiles horizontally across a standard 1280x800 window) rather than the zoomed-out 1x placeholder view.
3. Open the browser console (Press F12).
4. Type `window.audit.getZoom()` and press Enter. Verify it outputs `2`.
5. Type `window.audit.setZoom(4)` and press Enter. Verify the camera smoothly zooms in to 4x, doubling the size of every pixel cleanly with no blurring.
6. Walk around using WASD or the arrow keys at 4x zoom. Confirm there is no shimmering or seam crawling along wall and floor edges.
7. Type `window.audit.setZoom(2)` to return to normal zoom.
8. Type `window.audit.setZoom(1.5)` and press Enter. Confirm an error is thrown indicating zoom must be an integer $\ge 1$.
9. In a terminal, run `npm run verify` to confirm that all 161 automated tests, formatting checks, production build, architecture checks, and audit toolkit validations pass.
