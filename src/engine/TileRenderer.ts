import { Container, Graphics } from 'pixi.js';
import { AssetLoader } from './AssetLoader';

/** Anything the renderer can read tiles out of, without knowing what a tile means. */
export interface ReadableGrid {
  readonly width: number;
  readonly height: number;
  get(x: number, y: number): number;
}

export interface TileRendererOptions {
  /** Edge length of one tile in world pixels. */
  tileSize: number;
  /** Fill colour per tile value, indexed by the value itself. */
  palette: number[];
  /** Optional sprite keys per tile value, indexed by the value itself. */
  sprites?: (string | undefined)[];
  /**
   * Tile values that should not be drawn at all. Skipping the dominant value
   * (usually solid rock) removes most of the geometry at no visual cost,
   * because the stage background already shows through.
   */
  skip?: number[];
}

/**
 * TileRenderer — draws a grid of tiles into a PixiJS container.
 *
 * Tier 1. It is handed a grid, palette, and optional sprites, knowing nothing about
 * walls, floors or dungeons; the meaning of each tile value lives in Tier 2.
 */
export class TileRenderer {
  public readonly view: Container;
  private readonly graphics: Graphics;
  private readonly options: TileRendererOptions;
  private readonly skip: Set<number>;
  private readonly warnedMissingSprites = new Set<string>();

  constructor(options: TileRendererOptions) {
    this.options = options;
    this.skip = new Set(options.skip ?? []);
    this.view = new Container();
    this.graphics = new Graphics();
    this.view.addChild(this.graphics);
  }

  /**
   * Redraws the whole grid. Rectangles sharing a colour/texture are batched into one
   * fill call per tile value, and runs of identical tiles along a row are merged
   * into a single rectangle, which cuts the geometry for a typical cave by
   * roughly an order of magnitude.
   */
  public render(grid: ReadableGrid): void {
    this.graphics.clear();

    const { tileSize, palette, sprites } = this.options;

    for (let value = 0; value < palette.length; value++) {
      if (this.skip.has(value)) continue;

      const spriteKey = sprites?.[value];
      const texture = spriteKey ? AssetLoader.get(spriteKey) : undefined;
      if (spriteKey && !texture && !this.warnedMissingSprites.has(spriteKey)) {
        this.warnedMissingSprites.add(spriteKey);
        console.warn(
          `[AssetLoader] Missing tile sprite "${spriteKey}", falling back to palette colour`,
        );
      }

      if (texture) {
        for (let y = 0; y < grid.height; y++) {
          for (let x = 0; x < grid.width; x++) {
            if (grid.get(x, y) === value) {
              this.graphics.texture(
                texture,
                0xffffff,
                x * tileSize,
                y * tileSize,
                tileSize,
                tileSize,
              );
            }
          }
        }
      } else {
        let drewAny = false;

        for (let y = 0; y < grid.height; y++) {
          let runStart = -1;

          for (let x = 0; x <= grid.width; x++) {
            const matches = x < grid.width && grid.get(x, y) === value;

            if (matches && runStart === -1) {
              runStart = x;
            } else if (!matches && runStart !== -1) {
              this.graphics.rect(
                runStart * tileSize,
                y * tileSize,
                (x - runStart) * tileSize,
                tileSize,
              );
              drewAny = true;
              runStart = -1;
            }
          }
        }

        if (drewAny) {
          this.graphics.fill(palette[value]);
        }
      }
    }
  }

  public destroy(): void {
    this.view.destroy({ children: true });
  }
}
