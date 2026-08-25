import { Container, Graphics } from 'pixi.js';

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

/** Parses a colour written as a hex string in a Tier 3 pack (e.g. "0x0000ff"). */
export function parseColor(value: string | number): number {
  return typeof value === 'number' ? value : Number(value);
}
