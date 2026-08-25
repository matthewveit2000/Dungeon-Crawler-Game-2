import { Container, Graphics } from 'pixi.js';

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
 * Tier 1. It is handed a grid and a palette and knows nothing about walls,
 * floors or dungeons; the meaning of each tile value lives in Tier 2.
 */
export class TileRenderer {
  public readonly view: Container;
  private readonly graphics: Graphics;
  private readonly options: TileRendererOptions;
  private readonly skip: Set<number>;

  constructor(options: TileRendererOptions) {
    this.options = options;
    this.skip = new Set(options.skip ?? []);
    this.view = new Container();
    this.graphics = new Graphics();
    this.view.addChild(this.graphics);
  }

  /**
   * Redraws the whole grid. Rectangles sharing a colour are batched into one
   * fill call per colour, and runs of identical tiles along a row are merged
   * into a single rectangle, which cuts the geometry for a typical cave by
   * roughly an order of magnitude.
   */
  public render(grid: ReadableGrid): void {
    this.graphics.clear();

    const { tileSize, palette } = this.options;

    for (let value = 0; value < palette.length; value++) {
      if (this.skip.has(value)) continue;

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

      if (drewAny) this.graphics.fill(palette[value]);
    }
  }

  public destroy(): void {
    this.view.destroy({ children: true });
  }
}
