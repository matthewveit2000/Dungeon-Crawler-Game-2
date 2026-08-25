import { Container, Graphics } from 'pixi.js';
import { ReadableGrid, TileRenderer } from './TileRenderer';

export interface MapOverlayOptions {
  /** Edge length of one tile in the overlay, in screen pixels. */
  tileSize: number;
  palette: number[];
  /** Colour of the panel drawn behind the map. */
  backdrop?: number;
  backdropAlpha?: number;
  /** Gap between the map and the edge of its panel, in screen pixels. */
  padding?: number;
}

/**
 * MapOverlay — a screen-space, macro-scale view of a grid.
 *
 * Tier 1. It deliberately lives outside the camera-pivoted world container: an
 * overlay parented to the world would be positioned in world coordinates and
 * would scroll off-screen the moment the camera locked onto the player.
 */
export class MapOverlay {
  public readonly view: Container;
  private renderer: TileRenderer | null = null;
  private backdrop: Graphics | null = null;
  private readonly options: MapOverlayOptions;

  constructor(options: MapOverlayOptions) {
    this.options = options;
    this.view = new Container();
    this.view.visible = false;
  }

  public get isVisible(): boolean {
    return this.view.visible;
  }

  /** Draws `grid` and centres it in a viewport of the given size. */
  public show(grid: ReadableGrid, screenWidth: number, screenHeight: number): void {
    this.clear();

    const { tileSize, backdrop, backdropAlpha, padding = 0 } = this.options;
    const mapWidth = grid.width * tileSize;
    const mapHeight = grid.height * tileSize;

    // A panel behind the map separates it from the live game underneath, which
    // otherwise shows through around the edges and makes the map hard to read.
    if (backdrop !== undefined) {
      this.backdrop = new Graphics();
      this.backdrop.rect(-padding, -padding, mapWidth + padding * 2, mapHeight + padding * 2);
      this.backdrop.fill({ color: backdrop, alpha: backdropAlpha ?? 1 });
      this.view.addChild(this.backdrop);
    }

    this.renderer = new TileRenderer({ tileSize, palette: this.options.palette });
    this.renderer.render(grid);
    this.view.addChild(this.renderer.view);

    this.view.x = (screenWidth - mapWidth) / 2;
    this.view.y = (screenHeight - mapHeight) / 2;
    this.view.visible = true;
  }

  public hide(): void {
    this.clear();
    this.view.visible = false;
  }

  /** Shows the overlay if hidden, hides it if shown. Returns the new state. */
  public toggle(grid: ReadableGrid, screenWidth: number, screenHeight: number): boolean {
    if (this.view.visible) {
      this.hide();
      return false;
    }
    this.show(grid, screenWidth, screenHeight);
    return true;
  }

  /** Releases the drawn geometry so repeated toggles cannot accumulate memory. */
  private clear(): void {
    if (this.renderer) {
      this.view.removeChild(this.renderer.view);
      this.renderer.destroy();
      this.renderer = null;
    }
    if (this.backdrop) {
      this.view.removeChild(this.backdrop);
      this.backdrop.destroy();
      this.backdrop = null;
    }
  }
}
