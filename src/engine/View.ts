import { Container, Graphics, Sprite } from 'pixi.js';
import { AssetLoader } from './AssetLoader';

/**
 * View — the Tier 1 bridge between game data and PixiJS display objects.
 *
 * Tier 2 modules describe what an entity looks like as plain data and never
 * import PixiJS themselves. This module is the only place entity visuals are
 * constructed, so a change of renderer touches one file.
 */
export interface ShapeSpec {
  /** Width in world pixels. */
  width: number;
  /** Height in world pixels. */
  height: number;
  /** Fill colour as a 24-bit RGB integer. */
  color: number;
}

export interface VisualSpec extends ShapeSpec {
  /** Optional sprite identifier declared in Tier 3. */
  sprite?: string;
  /** Optional animations configuration declared in Tier 3. */
  animations?: Record<string, { frames: string[]; fps: number; loop?: boolean }>;
  /** Initial animation to play upon creation. */
  defaultAnimation?: string;
}

/**
 * Builds a centre-pivoted container for a rectangular entity, so that setting
 * `container.x/y` positions the entity by its centre rather than its corner.
 */
export function createRectView(spec: ShapeSpec): Container {
  const container = new Container();
  const graphics = new Graphics();

  graphics.rect(0, 0, spec.width, spec.height);
  graphics.fill(spec.color);

  container.addChild(graphics);
  container.pivot.set(spec.width / 2, spec.height / 2);

  return container;
}

const warnedMissingSprites = new Set<string>();

/** Resets the set of warned missing sprites (used in test cleanups). */
export function resetWarnedMissingSprites(): void {
  warnedMissingSprites.clear();
}

/**
 * Builds a centre-pivoted view for an entity. If a sprite or animation frame is
 * declared and available in AssetLoader, renders with the sprite. If missing,
 * logs a warning and falls back to a coloured rectangle placeholder per the
 * Graceful Failure rule.
 */
export function createView(spec: VisualSpec): Container {
  const initialSpriteKey =
    (spec.defaultAnimation && spec.animations?.[spec.defaultAnimation]?.frames[0]) || spec.sprite;

  if (initialSpriteKey) {
    const texture = AssetLoader.get(initialSpriteKey);
    if (texture) {
      const container = new Container();
      const sprite = new Sprite(texture);
      sprite.anchor.set(0.5, 0.5);
      container.addChild(sprite);
      return container;
    }
    if (!warnedMissingSprites.has(initialSpriteKey)) {
      warnedMissingSprites.add(initialSpriteKey);
      console.warn(
        `[AssetLoader] Missing sprite "${initialSpriteKey}", falling back to placeholder`,
      );
    }
  }

  return createRectView(spec);
}

/** Parses a colour written as a hex string in a Tier 3 pack (e.g. "0x0000ff"). */
export function parseColor(value: string | number): number {
  return typeof value === 'number' ? value : Number(value);
}
