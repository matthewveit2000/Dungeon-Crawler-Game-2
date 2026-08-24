/**
 * MapGrid
 * Represents a 2D spatial grid backed by a 1D array for optimized memory lookups.
 * The generic type <T> allows it to store different types of data (e.g., tile IDs, objects).
 */
export class MapGrid<T> {
  private readonly data: T[];
  public readonly width: number;
  public readonly height: number;

  /**
   * Initializes a new MapGrid.
   * @param width The width of the grid in tiles.
   * @param height The height of the grid in tiles.
   * @param initialValue The value to initialize all cells with.
   */
  constructor(width: number, height: number, initialValue: T) {
    this.width = width;
    this.height = height;

    // Create the 1D array and fill it with the initial value
    this.data = new Array<T>(width * height).fill(initialValue);
  }

  /**
   * Converts a 2D (X, Y) coordinate into a 1D array index.
   * @param x The X coordinate.
   * @param y The Y coordinate.
   * @returns The 1D index.
   */
  private getIndex(x: number, y: number): number {
    return y * this.width + x;
  }

  /**
   * Validates whether a coordinate is within the bounds of the grid.
   * @param x The X coordinate.
   * @param y The Y coordinate.
   * @returns True if within bounds, false otherwise.
   */
  private inBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  /**
   * Retrieves the value at the specified (X, Y) coordinate.
   * @param x The X coordinate.
   * @param y The Y coordinate.
   * @returns The value at that coordinate.
   * @throws Error if coordinates are out of bounds.
   */
  public get(x: number, y: number): T {
    if (!this.inBounds(x, y)) {
      throw new Error(`Out of bounds: (${x}, ${y})`);
    }
    const index = this.getIndex(x, y);
    return this.data[index];
  }

  /**
   * Sets the value at the specified (X, Y) coordinate.
   * @param x The X coordinate.
   * @param y The Y coordinate.
   * @param value The value to set.
   * @throws Error if coordinates are out of bounds.
   */
  public set(x: number, y: number, value: T): void {
    if (!this.inBounds(x, y)) {
      throw new Error(`Out of bounds: (${x}, ${y})`);
    }
    const index = this.getIndex(x, y);
    this.data[index] = value;
  }
}
