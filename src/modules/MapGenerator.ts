import { MapGrid } from './MapGrid';

export enum TileType {
  WALL = 0,
  FLOOR = 1
}

export class MapGenerator {
  /**
   * Performs a random walk to carve out contiguous floor space.
   * @param grid The MapGrid instance to mutate.
   * @param steps The number of steps the random walker should take.
   */
  public static generateRandomWalk(grid: MapGrid<TileType>, steps: number): void {
    // Start at the center of the grid
    let currentX = Math.floor(grid.width / 2);
    let currentY = Math.floor(grid.height / 2);

    // Ensure the starting position is a floor
    grid.set(currentX, currentY, TileType.FLOOR);

    const directions = [
      { dx: 0, dy: -1 }, // Up
      { dx: 0, dy: 1 },  // Down
      { dx: -1, dy: 0 }, // Left
      { dx: 1, dy: 0 }   // Right
    ];

    for (let i = 0; i < steps; i++) {
      // Pick a random direction
      const dirIndex = Math.floor(Math.random() * directions.length);
      const dir = directions[dirIndex];

      // Calculate new position
      const nextX = currentX + dir.dx;
      const nextY = currentY + dir.dy;

      // Check bounds (keep an outer perimeter of walls, so min is 1, max is width-2)
      if (nextX >= 1 && nextX < grid.width - 1 && nextY >= 1 && nextY < grid.height - 1) {
        currentX = nextX;
        currentY = nextY;

        // Carve floor
        grid.set(currentX, currentY, TileType.FLOOR);
      }
    }
  }
}
