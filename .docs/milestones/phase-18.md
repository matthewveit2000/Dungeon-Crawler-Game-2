# Milestone: EPIC 4.5 / Phase 18: Sprite Animation

## 1. Executive Summary

The dungeon crawler now features animated pixel art for entities, bringing the world and character to life.

- **Living Character Animations:** The player character no longer glides statically across the floor. While walking, the character plays a 4-frame walking stride animation showing moving boots, swaying tunic, and moving sword.
- **Natural Idle Stance:** When stopped, the character transitions smoothly to a 2-frame idle stance with subtle breathing and crest movements.
- **Deterministic Fixed-Timestep Playback:** Animation playback is directly driven by the engine's fixed simulation loop (`GameLoop`), ensuring that the animation plays at the exact same pace regardless of whether the user is playing on a 30Hz display, a 60Hz laptop, or a 144Hz desktop.

## 2. Technical Decisions & Architecture

This phase spans Tier 1 (Engine) and Tier 3 (Packs), while cleanly updating Tier 2 (Modules) state transitions without leaking rendering code:

- **Tier 1 SpriteAnimator (`src/engine/SpriteAnimator.ts`):** A deterministic, time-based animation controller. It advances an active animation track by fixed-step delta time `dt` without depending on wall-clock time. Mathematically: $\text{frame} = \lfloor \text{elapsedTime} \times \text{fps} \rfloor \pmod N$, guaranteeing that the same elapsed duration produces the exact same frame regardless of step granularity.
- **Texture Swap on Existing Display Object (`src/engine/Entity.ts`):** Rather than creating, deleting, or re-instantiating PixiJS display objects on each frame change, `Entity.updateAnimation()` updates the `texture` property of the existing `Sprite` display object. This incurs zero garbage collection and zero GPU reallocation overhead.
- **Tier 3 Animation Specifications (`src/packs/Player.json`, `src/packs/Art.json`):** Animation tracks (`idle` at 2 fps, `walk` at 8 fps) and frame names are declared in `Player.json`. The individual 32x32 frame assets are declared in `Art.json`.
- **Tier 2 Animation State Transitions (`src/modules/Player.ts`):** `Player` evaluates directional input and velocity. When velocity is non-zero, it invokes `this.playAnimation('walk')`; when velocity returns to zero, it calls `this.playAnimation('idle')`. No PixiJS code or rendering types are imported into Tier 2.

## 3. Lessons Learned

- **Avoiding GC Spikes in Sprite Animation:** Rebuilding display objects (or containers) on frame changes causes memory fragmentation and garbage collection pauses. Mutating `sprite.texture = texture` on an existing display object is instantaneous, preserves the scene graph, and keeps 60fps performance rock-solid.
- **Preserving Playback Continuity:** Calling `animator.play(name)` on an animation that is already playing must be an intentional no-op that preserves elapsed playback time. If `play('walk')` reset elapsed time every frame while the player held 'W', the animation would perpetually restart at frame 0 and freeze.
- **Determinism in Frame Selection:** By tracking cumulative elapsed time rather than incrementing frame indices, arbitrary fractional time slices (such as pausing or lag compensation) resolve deterministically to the correct authored frame.

## 4. Effortless Audit Toolkit

**Audit Steps:**

1. The development server is started automatically (`npm run dev`) at:
   👉 **[http://localhost:5173/](http://localhost:5173/)**
2. **Idle Animation Audit:**
   - Stand still after the page loads.
   - Observe the player character gently cycling between standing and breathing postures at 2 fps.
3. **Walk Animation Audit:**
   - Press and hold WASD or the arrow keys to walk across the room.
   - Observe the player character immediately transitioning to the 4-frame walk cycle at 8 fps, displaying animated strides and sword movement.
4. **Stopping Audit:**
   - Release the keys.
   - Observe the player immediately return to the idle animation.
5. **Macro Zoom Audit:**
   - Open the browser console (F12) and type:
     ```javascript
     window.audit.setZoom(4);
     ```
   - Walk around at 4x zoom to clearly inspect the pixel art animation frames. Notice that nearest-neighbour filtering keeps every animated pixel razor-sharp. Return to 2x zoom with `window.audit.setZoom(2)`.
6. **Diagnostic Verification:**
   - Type `window.audit.spawnTestSquare()` to confirm non-animated diagnostic entities continue to render and spin without error.
7. **Automated Verification:**
   - In a terminal, run `npm run verify` to confirm all 184 tests, formatting checks, architecture checks, and audit toolkit checks pass.
