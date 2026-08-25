import { Container, Graphics, Text, TextStyle } from 'pixi.js';

export interface GameOverOverlayOptions {
  screenWidth: number;
  screenHeight: number;
}

/**
 * GameOverOverlay — renders a full-screen block when the player dies.
 *
 * Tier 1. Manages a dark background and a central text prompt. Kept hidden
 * until explicitly shown.
 */
export class GameOverOverlay {
  public readonly view: Container;

  private readonly background: Graphics;
  private readonly text: Text;

  constructor(options: GameOverOverlayOptions) {
    this.view = new Container();
    this.view.visible = false;

    this.background = new Graphics();

    const style = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 72,
      fill: 0xff0000,
      dropShadow: {
        alpha: 1,
        angle: Math.PI / 6,
        blur: 4,
        color: 0x000000,
        distance: 4,
      },
      fontWeight: 'bold',
      align: 'center',
    });

    this.text = new Text({ text: 'GAME OVER', style });
    this.text.anchor.set(0.5);

    this.view.addChild(this.background);
    this.view.addChild(this.text);

    this.resize(options.screenWidth, options.screenHeight);
  }

  public show(): void {
    this.view.visible = true;
  }

  public resize(screenWidth: number, screenHeight: number): void {
    this.background.clear();
    this.background.rect(0, 0, screenWidth, screenHeight);
    this.background.fill({ color: 0x000000, alpha: 0.8 });

    this.text.x = screenWidth / 2;
    this.text.y = screenHeight / 2;
  }
}
