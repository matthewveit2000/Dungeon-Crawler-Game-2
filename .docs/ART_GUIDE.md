# Art Guide: Sprite Specification (ART_GUIDE.md)

This document is the specification for anyone — human or AI — producing art for this game. It is the source of truth for sprite dimensions, alignment and naming. Code enforces the key numbers in `src/packs/packs.test.ts`, so this document and the build cannot drift apart.

## 1. The Headline Number

**Every sprite is authored on a 64 x 64 pixel canvas.**

One sprite is exactly one world tile. Nothing is scaled at import: a 64 x 64 image occupies a 64 x 64 tile at 1:1. This is the single most important rule here, because any mismatch between art size and tile size forces a non-integer scale, and non-integer scaling is what turns crisp pixel art into mush.

Larger things are whole multiples of a tile — a boss might be 128 x 128 (2 x 2 tiles) or 192 x 192 (3 x 3). Never 100 x 100, never 1.5 tiles.

## 2. Why 64 and Not 16 or 32

64 x 64 puts this project at the high-fidelity end of pixel art — the register of *Dead Cells* or *Blasphemous* rather than the Game Boy. That is a deliberate choice, and it has consequences worth understanding.

**What it buys.** A 64 x 64 character has room for readable armour, a distinguishable weapon, facial detail, and multi-tone shading. Since loot is a core system, and a player needs to see at a glance that they have equipped something different, that detail is doing real work. At 16 x 16 a sword and an axe are a few pixels apart and effectively identical in silhouette.

**What it costs.** Four times the pixels of a 32 x 32 sprite means roughly four times the drawing time per asset, and four times the memory per frame of animation. A large enemy roster at this fidelity is a substantial art budget. If that becomes the bottleneck, the honest fix is fewer enemy types with more character, not a mid-project resolution change — see section 6.

## 3. Screen Layout

At 64 x 64 tiles and no zoom, a 1280 x 800 window shows **20 x 12.5 tiles**. That is a deliberate tactical view: wide enough to see an enemy approaching and react, tight enough that the character reads as a character rather than a dot.

| Window | Tiles visible (at 1x zoom) |
|---|---|
| 1280 x 800 | 20 x 12.5 |
| 1920 x 1080 | 30 x 17 |
| 2560 x 1440 (2x zoom) | 20 x 11 |

On very large displays a 2x zoom keeps the tile count sensible. **Zoom must always be a whole number.** A 1.5x zoom means one art pixel covers one and a half screen pixels, which cannot be drawn evenly and produces visible seams and shimmer.

## 4. Sprite Size Versus Collision Size

These are two different things and confusing them causes bugs.

- **Sprite size** is how big the art is: 64 x 64.
- **Collision box** is the rectangle the physics engine tests against walls. The player's is **16 x 16** — a quarter of the sprite, set by `sizeRatio` in `src/packs/Player.json`.

The box is deliberately much smaller than the art. It represents roughly the character's feet, not their whole silhouette. A character that collided across the full width of their sprite could not walk through a gap their art suggests they should fit, and the game would feel unresponsive and unfair. This is standard practice in top-down games and is why the two numbers are configured separately.

The collision box must stay a whole number of pixels — `packs.test.ts` enforces this — so that collision boundaries land on pixel edges.

## 5. Authoring Rules

- **Canvas:** 64 x 64, transparent background. Multiples of 64 for larger entities.
- **No anti-aliasing.** Every pixel fully opaque or fully transparent at the edges. Soft edges defeat the entire style and look blurred once the game scales.
- **Draw at 1:1.** Author at 64 x 64 and let the game scale up. Drawing at 256 x 256 and downsampling produces half-tones that are not pixel art.
- **Alignment.** A floor or wall tile must tile seamlessly with itself on all four edges. A character sprite should stand with its feet in the lower portion of the canvas, so its collision box — which sits at the sprite's centre — lands where the character's feet are.
- **Palette.** Keep a constrained, shared palette across assets. Placeholder colours currently live in `src/packs/World.json`; a full palette will be defined when real art lands.
- **Format:** PNG with alpha.

## 6. Changing This Number Later

The resolution is not welded in. `spriteResolution` and `tileSize` in `src/packs/World.json` are the only places it is stated, and the code derives everything else from them — the test suite builds its fixtures from `level.tileSize` rather than hardcoded pixels precisely so a change of scale cannot silently invalidate what the tests check.

What *would* be expensive is redrawing art. Once a real asset library exists, changing resolution means redrawing all of it. So the number is cheap to change now and expensive to change later, which is why it is being settled before Epic 5 needs its first enemy sprite.

If it does need to change, the checklist is: update `spriteResolution` and `tileSize` together, scale `speed` in `Player.json` by the same factor to preserve movement feel in tiles per second, update this document, and run the suite.

## 7. Where This Is Enforced

| Rule | Enforced by |
|---|---|
| Sprite resolution is 64 | `src/packs/packs.test.ts` |
| One tile equals one sprite | `src/packs/packs.test.ts` |
| Full-tile interactables are one sprite | `src/packs/packs.test.ts` |
| Collision box is smaller than the sprite | `src/packs/packs.test.ts` |
| Collision box is a whole number of pixels | `src/packs/packs.test.ts` |
| Nearest-neighbour filtering, integer zoom | Phase 16 — not yet built |
| Camera snaps to whole pixels | Phase 16 — not yet built |

The rendering rules in the last two rows are specified in `.docs/SYSTEMS_OVERVIEW.md` section 1b and scheduled as Epic 4.5 in `ROADMAP.md`. Until those phases land, the game draws flat coloured rectangles at the correct dimensions rather than sprites.
