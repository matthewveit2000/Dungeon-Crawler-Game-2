import { MapGrid } from './MapGrid';
import { TileType } from './MapGenerator';

export interface GridCoord {
  x: number;
  y: number;
}

export interface NeighborStep extends GridCoord {
  diagonal: boolean;
}

const CARDINALS: readonly GridCoord[] = [
  { x: 0, y: -1 }, // Up
  { x: 1, y: 0 }, // Right
  { x: 0, y: 1 }, // Down
  { x: -1, y: 0 }, // Left
];

const DIRECTIONS: readonly NeighborStep[] = [
  // Cardinals
  { x: 0, y: -1, diagonal: false },
  { x: 1, y: 0, diagonal: false },
  { x: 0, y: 1, diagonal: false },
  { x: -1, y: 0, diagonal: false },
  // Diagonals (allow moving diagonally across open rooms and diagonal corridors)
  { x: 1, y: -1, diagonal: true },
  { x: 1, y: 1, diagonal: true },
  { x: -1, y: 1, diagonal: true },
  { x: -1, y: -1, diagonal: true },
];

/**
 * Checks whether an entity can travel in an unobstructed straight line between
 * `from` and `to` without intersecting any level geometry.
 */
export function hasDirectLineOfSight(
  isSolid: (x: number, y: number, w: number, h: number) => boolean,
  from: { x: number; y: number },
  to: { x: number; y: number },
  width: number,
  height: number,
  stepSize = 16,
): boolean {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 0.001) return true;

  const steps = Math.ceil(dist / Math.max(stepSize, 1));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = from.x + dx * t;
    const y = from.y + dy * t;
    if (isSolid(x, y, width, height)) {
      return false;
    }
  }
  return true;
}

/**
 * Finds the shortest path of walkable floor tiles from start to goal using 8-directional BFS.
 *
 * Tier 2. Operates entirely on MapGrid without rendering references.
 * Returns an array of tile coordinates leading from start to goal (excluding start).
 */
export function findPath(
  grid: MapGrid<TileType>,
  start: GridCoord,
  goal: GridCoord,
  maxDistance = 40,
): GridCoord[] {
  // If start is not a floor tile, find adjacent floor tile
  let effectiveStart = start;
  if (
    effectiveStart.x < 0 ||
    effectiveStart.x >= grid.width ||
    effectiveStart.y < 0 ||
    effectiveStart.y >= grid.height ||
    grid.get(effectiveStart.x, effectiveStart.y) !== TileType.FLOOR
  ) {
    const neighbor = CARDINALS.map((d) => ({ x: start.x + d.x, y: start.y + d.y })).find(
      (p) =>
        p.x >= 0 &&
        p.x < grid.width &&
        p.y >= 0 &&
        p.y < grid.height &&
        grid.get(p.x, p.y) === TileType.FLOOR,
    );
    if (!neighbor) return [];
    effectiveStart = neighbor;
  }

  // If goal is not a floor tile, find adjacent floor tile
  let effectiveGoal = goal;
  if (
    effectiveGoal.x < 0 ||
    effectiveGoal.x >= grid.width ||
    effectiveGoal.y < 0 ||
    effectiveGoal.y >= grid.height ||
    grid.get(effectiveGoal.x, effectiveGoal.y) !== TileType.FLOOR
  ) {
    const neighbor = CARDINALS.map((d) => ({ x: goal.x + d.x, y: goal.y + d.y })).find(
      (p) =>
        p.x >= 0 &&
        p.x < grid.width &&
        p.y >= 0 &&
        p.y < grid.height &&
        grid.get(p.x, p.y) === TileType.FLOOR,
    );
    if (!neighbor) return [];
    effectiveGoal = neighbor;
  }

  if (effectiveStart.x === effectiveGoal.x && effectiveStart.y === effectiveGoal.y) {
    return [];
  }

  const width = grid.width;
  const startIndex = effectiveStart.y * width + effectiveStart.x;
  const goalIndex = effectiveGoal.y * width + effectiveGoal.x;

  const queue: number[] = [startIndex];
  const cameFrom = new Map<number, number>();
  const distance = new Map<number, number>();

  cameFrom.set(startIndex, startIndex);
  distance.set(startIndex, 0);

  let found = false;

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current === goalIndex) {
      found = true;
      break;
    }

    const currentDist = distance.get(current)!;
    if (currentDist >= maxDistance) {
      continue;
    }

    const curX = current % width;
    const curY = Math.floor(current / width);

    for (const dir of DIRECTIONS) {
      const nextX = curX + dir.x;
      const nextY = curY + dir.y;

      if (nextX < 0 || nextX >= grid.width || nextY < 0 || nextY >= grid.height) {
        continue;
      }

      if (grid.get(nextX, nextY) !== TileType.FLOOR) {
        continue;
      }

      // For diagonals, both adjacent cardinal tiles must also be FLOOR to prevent cutting inside wall corners
      if (dir.diagonal) {
        if (
          grid.get(curX + dir.x, curY) !== TileType.FLOOR ||
          grid.get(curX, curY + dir.y) !== TileType.FLOOR
        ) {
          continue;
        }
      }

      const nextIndex = nextY * width + nextX;
      if (!cameFrom.has(nextIndex)) {
        cameFrom.set(nextIndex, current);
        distance.set(nextIndex, currentDist + 1);
        queue.push(nextIndex);
      }
    }
  }

  if (!found) {
    return [];
  }

  // Reconstruct path backward from goal to start
  const path: GridCoord[] = [];
  let curr = goalIndex;

  while (curr !== startIndex) {
    const x = curr % width;
    const y = Math.floor(curr / width);
    path.unshift({ x, y });
    curr = cameFrom.get(curr)!;
  }

  return path;
}
