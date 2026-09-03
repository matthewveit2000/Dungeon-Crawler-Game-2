# Asset Credits (CREDITS.md)

This document records the provenance, licensing, and author attribution for all graphical and audio assets included in this repository, per the standards defined in `.docs/ART_GUIDE.md` Section 6.

## Pixel Art Sprites & Animations (DCSS CC0 Tileset)

All game sprites and tile assets are sourced from the **Dungeon Crawl Stone Soup 32x32 Tiles** collection hosted on OpenGameArt.org.

- **Source URL:** https://opengameart.org/content/dungeon-crawl-32x32-tiles
- **Author:** Dungeon Crawl Stone Soup (DCSS) Art Team & Contributors
- **Licence:** Creative Commons CC0 1.0 Universal (Public Domain Dedication)
- **Local Licence Copy:** `assets/raw/DCSS_LICENSE.txt`
- **Original Archive:** `assets/raw/crawl-tiles-Oct-5-2010.zip`

### Mapped Assets

| Game Asset | Local Path | Native DCSS Asset Path | Resolution | Licence | Modified |
|---|---|---|---|---|---|
| Dungeon Floor | `public/assets/tiles/floor.png` | `dc-dngn/floor/rect_gray0.png` | 32 x 32 | CC0 1.0 | No (1:1 drop-in) |
| Dungeon Wall | `public/assets/tiles/wall.png` | `dc-dngn/wall/brick_dark0.png` | 32 x 32 | CC0 1.0 | No (1:1 drop-in) |
| Descending Staircase | `public/assets/entities/staircase.png` | `dc-dngn/gateways/stone_stairs_down.png` | 32 x 32 | CC0 1.0 | No (1:1 drop-in) |
| Adventurer Player | `public/assets/entities/player.png` | Composite from DCSS player doll parts (`human_m`, `bplate_metal1`, `fhelm_gray3`, `long_sword`, `cloak/green`, `boots`) | 32 x 32 | CC0 1.0 | Yes (Layered composite) |
| Player Idle 0 | `public/assets/entities/player_idle_0.png` | DCSS adventurer standing base frame | 32 x 32 | CC0 1.0 | Yes (Layered composite) |
| Player Idle 1 | `public/assets/entities/player_idle_1.png` | DCSS adventurer subtle breathing frame | 32 x 32 | CC0 1.0 | Yes (1px breath offset) |
| Player Walk 0 | `public/assets/entities/player_walk_0.png` | DCSS adventurer left stride frame | 32 x 32 | CC0 1.0 | Yes (stride offset) |
| Player Walk 1 | `public/assets/entities/player_walk_1.png` | DCSS adventurer neutral passing frame | 32 x 32 | CC0 1.0 | Yes (neutral stride) |
| Player Walk 2 | `public/assets/entities/player_walk_2.png` | DCSS adventurer right stride frame | 32 x 32 | CC0 1.0 | Yes (stride offset) |
| Player Walk 3 | `public/assets/entities/player_walk_3.png` | DCSS adventurer neutral passing frame | 32 x 32 | CC0 1.0 | Yes (neutral stride) |
| Goblin | `public/assets/entities/goblin.png` | `dc-mon/goblin.png` | 32 x 32 | CC0 1.0 | No (1:1 drop-in) |
| Skeleton | `public/assets/entities/skeleton.png` | `dc-mon/undead/skeletons/skeleton_humanoid_small.png` | 32 x 32 | CC0 1.0 | No (1:1 drop-in) |
| Giant Rat | `public/assets/entities/rat.png` | `dc-mon/animals/rat.png` | 32 x 32 | CC0 1.0 | No (1:1 drop-in) |

## Licences Summary

- **CC0 1.0 Universal**: Dedicated to the public domain. Free for commercial and non-commercial redistribution and modification without required attribution.
