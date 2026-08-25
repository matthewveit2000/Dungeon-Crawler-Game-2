import { Container, Text, TextStyle } from 'pixi.js';

export interface TimerOverlayOptions {
  /** Screen width to position the timer correctly. */
  screenWidth: number;
}

/**
 * TimerOverlay — renders the global countdown timer on the screen.
 *
 * Tier 1. Manages a PixiJS Text object and positions it anchored to the
 * top-center of the screen.
 */
export class TimerOverlay {
  public readonly view: Container;
  private readonly text: Text;

  constructor(options: TimerOverlayOptions) {
    this.view = new Container();

    const style = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 32,
      fill: 0xffffff, // White text
      dropShadow: {
        alpha: 1,
        angle: Math.PI / 6,
        blur: 4,
        color: 0x000000,
        distance: 2,
      },
      fontWeight: 'bold',
    });

    this.text = new Text({ text: '5:00', style });

    // Anchor to top center
    this.text.anchor.set(0.5, 0);
    this.text.y = 16;

    this.view.addChild(this.text);

    this.resize(options.screenWidth);
  }

  /** Updates the displayed text. */
  public updateTime(formattedTime: string): void {
    if (this.text.text !== formattedTime) {
      this.text.text = formattedTime;
    }
  }

  /** Re-centers the timer when the screen resizes. */
  public resize(screenWidth: number): void {
    this.text.x = screenWidth / 2;
  }
}
