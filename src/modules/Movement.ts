export interface Vec2 {
  x: number;
  y: number;
}

/** Reports whether an axis-aligned box centred on (x, y) overlaps solid space. */
export type SolidTest = (x: number, y: number, width: number, height: number) => boolean;

export interface MoveRequest {
  /** Current centre of the body. */
  from: Vec2;
  /** Desired movement for this step, in pixels. */
  delta: Vec2;
  width: number;
  height: number;
  /**
   * Largest distance the body may travel between collision tests. Keeping this
   * below half the smallest solid feature guarantees nothing can be jumped over.
   */
  maxStep: number;
}

/**
 * Resolves a movement request against solid geometry.
 *
 * Tier 2. Two properties matter, and both were defects in the first
 * implementation:
 *
 * - **No tunnelling.** Movement is split into substeps no longer than
 *   `maxStep`, so a long frame cannot carry a body clean through a wall.
 *   Testing only the destination made walls passable during any frame hitch.
 * - **No corner cutting.** The vertical axis is tested at the *already
 *   resolved* horizontal position, so the diagonal destination is always
 *   checked. Testing each axis against the original position let a body slip
 *   diagonally into an inside corner and become permanently wedged, since every
 *   direction out of a wall is itself blocked.
 */
export function resolveMovement(isSolid: SolidTest, request: MoveRequest): Vec2 {
  const { from, delta, width, height, maxStep } = request;

  // Already embedded in solid space — a state normal movement can no longer
  // produce, but a regenerating floor or a teleport still can. Move freely so
  // the body can always walk back out rather than being trapped forever.
  if (isSolid(from.x, from.y, width, height)) {
    return { x: from.x + delta.x, y: from.y + delta.y };
  }

  const distance = Math.hypot(delta.x, delta.y);
  if (distance === 0) return { x: from.x, y: from.y };

  const steps = Math.max(1, Math.ceil(distance / Math.max(maxStep, 0.0001)));
  const stepX = delta.x / steps;
  const stepY = delta.y / steps;

  let x = from.x;
  let y = from.y;

  for (let i = 0; i < steps; i++) {
    const movedX = slideAxis(isSolid, x, y, stepX, 0, width, height);
    x += movedX;

    // Resolved against the new x, which is what closes the corner-cut gap.
    const movedY = slideAxis(isSolid, x, y, 0, stepY, width, height);
    y += movedY;

    // Both axes are hard against a wall; further substeps cannot help.
    if (movedX === 0 && movedY === 0) break;
  }

  return { x, y };
}

/**
 * Number of bisection passes used to settle a blocked axis against a wall.
 * Eight passes resolve a half-tile step to well under a pixel, which is what
 * lets a body sit flush against geometry instead of stopping a substep short.
 */
const REFINE_PASSES = 8;

/**
 * Returns how far along one axis a body may travel before hitting solid space.
 *
 * The full step is tried first, which is the common case and costs one test.
 * Only when that is blocked does it bisect, so the body ends up touching the
 * wall rather than halting up to a whole substep away from it.
 */
function slideAxis(
  isSolid: SolidTest,
  x: number,
  y: number,
  stepX: number,
  stepY: number,
  width: number,
  height: number,
): number {
  const step = stepX || stepY;
  if (step === 0) return 0;

  if (!isSolid(x + stepX, y + stepY, width, height)) return step;

  let blocked = 1;
  let free = 0;

  for (let pass = 0; pass < REFINE_PASSES; pass++) {
    const mid = (free + blocked) / 2;
    if (isSolid(x + stepX * mid, y + stepY * mid, width, height)) {
      blocked = mid;
    } else {
      free = mid;
    }
  }

  return step * free;
}
