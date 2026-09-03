# Art Guide: Sprite Specification (ART_GUIDE.md)

This document is the specification for anyone — human or AI — producing or sourcing art for this game. It is the source of truth for sprite dimensions, alignment, naming and licensing. Code enforces the key numbers in `src/packs/packs.test.ts`, so this document and the build cannot drift apart.

## 1. The Headline Number

**Every sprite is authored on a 32 x 32 pixel canvas.**

One sprite is exactly one world tile. Nothing is scaled at import: a 32 x 32 image occupies a 32 x 32 tile at 1:1. This is the single most important rule here, because any mismatch between art size and tile size forces a non-integer scale, and non-integer scaling is what turns crisp pixel art into mush.

Larger things are whole multiples of a tile — a boss might be 64 x 64 (2 x 2 tiles) or 96 x 96 (3 x 3). Never 48 x 48, never 1.5 tiles.

## 2. Why 32 and Not 16 or 64

The project began at 64 x 64 and moved to 32 x 32 in Phase 11.7. The reason is supply, not taste.

**What it buys.** 32 x 32 is the lingua franca of freely licensed pixel art. The Dungeon Crawl Stone Soup tileset — thousands of public-domain monsters, weapons, armour and dungeon features, drawn for exactly this genre — is 32 x 32. So is the bulk of the free pack ecosystem. At 64 x 64 the project was committed to commissioning or drawing nearly every asset itself; at 32 x 32 it can draw on an existing library that already covers most of what Epics 5 through 8 need. For a project whose art budget is the binding constraint, that access is worth more than the extra pixels.

**What it costs.** A quarter of the pixels of a 64 x 64 sprite. A sword and an axe are still clearly distinguishable at 32 x 32 — this is the resolution most classic roguelikes and a great many modern ones use — but facial detail and fine armour ornament are gone. Since loot is a core system and a player must see at a glance that they have equipped something different, silhouette and colour now carry that job where detail used to help. Choose assets accordingly: distinct outlines beat intricate shading at this size.

**On upscaled art.** Do not import a 16 x 16 sprite upscaled to 32 x 32 unless nothing better exists. It stores four times the pixels for no added detail and mixes two visual registers on the same screen. Prefer 32 x 32 native art.

## 3. Screen Layout

**The default camera zoom is 2x**, declared as `defaultZoom` in `src/packs/World.json`. At 32 x 32 art and 2x zoom one tile covers 32 screen pixels, so a 1280 x 800 window shows **20 x 12.5 tiles** — a deliberate tactical view, wide enough to see an enemy approaching and react, tight enough that the character reads as a character rather than a dot. This is the same framing the project had at 64 x 64 art and 1x zoom; the art got smaller, the view did not.

| Window | Zoom | Tiles visible |
|---|---|---|
| 1280 x 800 | 2x | 20 x 12.5 |
| 1920 x 1080 | 2x | 30 x 17 |
| 2560 x 1440 | 4x | 20 x 11 |

**Zoom must always be a whole number.** A 1.5x zoom means one art pixel covers one and a half screen pixels, which cannot be drawn evenly and produces visible seams and shimmer. `packs.test.ts` asserts that `defaultZoom` is an integer.

Until Phase 16 builds camera zoom, the game draws at 1x and the view is correspondingly wider. That is a known interim state, not the intended framing.

## 4. Sprite Size Versus Collision Size

These are two different things and confusing them causes bugs.

- **Sprite size** is how big the art is: 32 x 32.
- **Collision box** is the rectangle the physics engine tests against walls. The player's is **8 x 8** — a quarter of the sprite, set by `sizeRatio` in `src/packs/Player.json`.

The box is deliberately much smaller than the art. It represents roughly the character's feet, not their whole silhouette. A character that collided across the full width of their sprite could not walk through a gap their art suggests they should fit, and the game would feel unresponsive and unfair. This is standard practice in top-down games and is why the two numbers are configured separately.

The collision box must stay a whole number of pixels — `packs.test.ts` enforces this — so that collision boundaries land on pixel edges. This is what stops `sizeRatio` being set to something like 0.3, which at 32 pixels would put the box edge on a fraction of a pixel.

## 5. Authoring Rules

- **Canvas:** 32 x 32, transparent background. Multiples of 32 for larger entities.
- **No anti-aliasing.** Every pixel fully opaque or fully transparent at the edges. Soft edges defeat the entire style and look blurred once the game scales.
- **Draw at 1:1.** Author at 32 x 32 and let the game scale up. Drawing at 128 x 128 and downsampling produces half-tones that are not pixel art.
- **Alignment.** A floor or wall tile must tile seamlessly with itself on all four edges. A character sprite should stand with its feet in the lower portion of the canvas, so its collision box — which sits at the sprite's centre — lands where the character's feet are.
- **Palette.** Keep a constrained, shared palette across assets. Placeholder colours currently live in `src/packs/World.json`; a full palette will be defined when real art lands.
- **Format:** PNG with alpha.

## 6. Sourcing Third-Party Art

The repository is public and the game deploys publicly. Committing an asset therefore **redistributes** it. That makes redistribution rights a hard requirement, not a nicety: a pack licensed "free to use, do not redistribute the files" cannot go in this repository at all, however good it looks.

**Acceptable licences:** CC0 / public domain (no attribution required, preferred), CC-BY (attribution required — record it), and per-pack licences that explicitly permit redistribution and commercial use.

**Avoid:** anything non-commercial, anything forbidding redistribution, and CC-BY-SA or GPL unless the viral terms are deliberately accepted.

**Recommended sources**, best fit first:

| Source | Licence | Notes |
|---|---|---|
| Dungeon Crawl Stone Soup tileset (via OpenGameArt) | CC0 | 32 x 32 native, genre-exact, thousands of assets |
| Kenney.nl | CC0 | Consistent and legally bulletproof; mostly 16 x 16 |
| OpenGameArt.org, filtered to CC0 | mixed — filter required | Quality varies; the licence filter is essential |
| itch.io free game assets | per-pack — read each | Best aesthetic quality; verify redistribution rights |
| game-icons.net | CC-BY 3.0 | Vector UI and inventory icons, not pixel art |

Verify terms at download time rather than trusting this table; they do change.

**Every asset must be recorded in `CREDITS.md`** with its source URL, author, licence, and whether it was modified. Slicing a spritesheet and rescaling both count as modification under CC-BY. Keep the pack's original licence file alongside the raw download in `assets/raw/`.

## 7. Changing This Number Later

The resolution is not welded in. `spriteResolution` and `tileSize` in `src/packs/World.json` are the only places it is stated, and the code derives everything else from them — the test suite builds its fixtures from `level.tileSize` rather than hardcoded pixels precisely so a change of scale cannot silently invalidate what the tests check. The 64 to 32 move in Phase 11.7 changed five numbers in three data files and broke no test.

What *would* be expensive is redrawing art. Once a real asset library exists, changing resolution means reacquiring or redrawing all of it. So the number is cheap to change now and expensive to change later, which is why it is being settled before Epic 5 needs its first enemy sprite.

If it does need to change, the checklist is: update `spriteResolution` and `tileSize` together, scale `speed` and `interactRadius` in `Player.json` by the same factor to preserve movement and reach in tiles, scale the full-tile entries in `Interactables.json`, adjust `defaultZoom` so the on-screen tile count is unchanged, update this document, and run `npm run verify`.

## 8. Where This Is Enforced

| Rule | Enforced by |
|---|---|
| Sprite resolution is 32 | `src/packs/packs.test.ts` |
| One tile equals one sprite | `src/packs/packs.test.ts`, `scripts/check-architecture.mjs` |
| Full-tile interactables are one sprite | `src/packs/packs.test.ts` |
| Collision box is smaller than the sprite | `src/packs/packs.test.ts` |
| Collision box is a whole number of pixels | `src/packs/packs.test.ts` |
| Default zoom is a whole number | `src/packs/packs.test.ts` |
| The resolution is never restated as a literal | `scripts/check-architecture.mjs` |
| Nearest-neighbour filtering, integer zoom | Phase 16 — not yet built |
| Camera snaps to whole pixels | Phase 16 — not yet built |

The rendering rules in the last two rows are specified in `.docs/SYSTEMS_OVERVIEW.md` section 1b and scheduled as Epic 4.5 in `ROADMAP.md`. Until those phases land, the game draws flat coloured rectangles at the correct dimensions rather than sprites.
