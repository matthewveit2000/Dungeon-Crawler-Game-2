import { Application, Container } from 'pixi.js';

export interface RendererOptions {
  /** Stage background colour as a 24-bit RGB integer. */
  background?: number;
}

/**
 * Renderer — owns the PixiJS application and the two root layers.
 *
 * Tier 1. The stage is split so the camera can move the world without dragging
 * screen-fixed elements (overlays, and later the HUD) along with it.
 */
export class Renderer {
  public app: Application;

  /** Camera-transformed layer: tiles, entities, anything with a world position. */
  public readonly world: Container;
  /** Screen-fixed layer: overlays and UI, never touched by the camera. */
  public readonly ui: Container;

  private readonly options: RendererOptions;

  constructor(options: RendererOptions = {}) {
    this.options = options;
    this.app = new Application();
    this.world = new Container();
    this.ui = new Container();
  }

  public async init(container: HTMLElement): Promise<void> {
    await this.app.init({
      width: window.innerWidth,
      height: window.innerHeight,
      resizeTo: window,
      background: this.options.background ?? 0x000000,
      // Render at the display's true pixel density instead of being upscaled.
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      antialias: false,
    });

    this.app.stage.addChild(this.world);
    this.app.stage.addChild(this.ui);

    container.appendChild(this.app.canvas);
  }

  /** Viewport size in CSS pixels — the units the camera and overlays work in. */
  public get screenWidth(): number {
    return this.app.renderer.screen.width;
  }

  public get screenHeight(): number {
    return this.app.renderer.screen.height;
  }

  public destroy(): void {
    this.app.destroy(true, { children: true, texture: true });
  }
}
