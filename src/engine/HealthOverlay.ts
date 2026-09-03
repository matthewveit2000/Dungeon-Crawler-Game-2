import { Container, Text, TextStyle } from 'pixi.js';

export interface HealthOverlayOptions {
  initialHealth: number;
  maxHealth: number;
}

/**
 * HealthOverlay — renders the player's health HUD element on the screen.
 *
 * Tier 1. Manages a PixiJS Text object anchored at top-left of the screen.
 */
export class HealthOverlay {
  public readonly view: Container;
  private readonly text: Text;

  constructor(options: HealthOverlayOptions) {
    this.view = new Container();

    const style = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 36,
      fill: 0xff4444, // Red-tinted / crisp text
      dropShadow: {
        alpha: 1,
        angle: Math.PI / 6,
        blur: 4,
        color: 0x000000,
        distance: 3,
      },
      fontWeight: 'bold',
    });

    this.text = new Text({
      text: `HP: ${options.initialHealth}/${options.maxHealth}`,
      style,
    });

    this.text.x = 24;
    this.text.y = 20;

    this.view.addChild(this.text);
  }

  /** Current text content for testing and verification. */
  public get displayedText(): string {
    return this.text.text;
  }

  /** Updates the displayed health counter. */
  public updateHealth(current: number, max: number): void {
    const safeCurrent = Math.max(0, current);
    const newText = `HP: ${safeCurrent}/${max}`;
    if (this.text.text !== newText) {
      this.text.text = newText;
    }
  }
}
