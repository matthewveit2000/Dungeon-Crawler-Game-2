import { Graphics, Container } from 'pixi.js';
import { MapGrid } from './MapGrid';
import { MapGenerator, TileType } from './MapGenerator';

export class Level {
  public grid: MapGrid<TileType>;
  public view: Container;
  public tileSize: number = 40; // Pixels per tile
  private mapGraphics: Graphics;
  private steps: number;

  constructor(width: number, height: number, steps: number = 5000) {
    this.steps = steps;
    this.grid = new MapGrid<TileType>(width, height, TileType.WALL);
    MapGenerator.generateRandomWalk(this.grid, this.steps);

    this.view = new Container();
    this.mapGraphics = new Graphics();

    this.renderTiles();
    this.view.addChild(this.mapGraphics);
  }

  public regenerate(): void {
    this.grid = new MapGrid<TileType>(this.grid.width, this.grid.height, TileType.WALL);
    MapGenerator.generateRandomWalk(this.grid, this.steps);
    this.renderTiles();
  }

  private renderTiles(): void {
    this.mapGraphics.clear();
    for (let y = 0; y < this.grid.height; y++) {
      for (let x = 0; x < this.grid.width; x++) {
        const type = this.grid.get(x, y);
        this.mapGraphics.rect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
        if (type === TileType.FLOOR) {
          this.mapGraphics.fill(0xaaaaaa); // Light gray for floor
        } else {
          this.mapGraphics.fill(0x333333); // Dark gray for wall
        }
      }
    }
  }

  /**
   * Checks if an AABB (Axis-Aligned Bounding Box) is colliding with any wall tiles.
   * @param x Center X of the entity.
   * @param y Center Y of the entity.
   * @param width Width of the entity.
   * @param height Height of the entity.
   * @returns true if colliding with a wall, false otherwise.
   */
  public isCollidingWithWall(x: number, y: number, width: number, height: number): boolean {
    // Assuming x and y are the center of the entity based on Player's pivot implementation
    const left = x - width / 2;
    const right = x + width / 2;
    const top = y - height / 2;
    const bottom = y + height / 2;

    const startGridX = Math.floor(left / this.tileSize);
    const endGridX = Math.floor((right - 0.001) / this.tileSize);
    const startGridY = Math.floor(top / this.tileSize);
    const endGridY = Math.floor((bottom - 0.001) / this.tileSize);

    for (let gy = startGridY; gy <= endGridY; gy++) {
      for (let gx = startGridX; gx <= endGridX; gx++) {
        // Treat out of bounds as walls
        if (gx < 0 || gx >= this.grid.width || gy < 0 || gy >= this.grid.height) {
          return true;
        }

        if (this.grid.get(gx, gy) === TileType.WALL) {
          return true;
        }
      }
    }

    return false;
  }
}
