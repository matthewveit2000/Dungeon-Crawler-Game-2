import { describe, it, expect, beforeEach } from 'vitest';
import { MapGrid } from './MapGrid';

describe('MapGrid', () => {
  let grid: MapGrid<number>;
  const width = 10;
  const height = 10;
  const initialValue = 0;

  beforeEach(() => {
    grid = new MapGrid<number>(width, height, initialValue);
  });

  it('should initialize a 1D array with the correct size', () => {
    // 10 * 10 = 100 elements
    // The internal representation should be 1D, but we can verify by checking if getting all coordinates works and returns the initial value.
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        expect(grid.get(x, y)).toBe(initialValue);
      }
    }
  });

  it('should map (X, Y) coordinates correctly to set and get values', () => {
    // We set a value at a specific coordinate
    grid.set(2, 3, 42);
    expect(grid.get(2, 3)).toBe(42);

    // Ensure it didn't overwrite other positions
    expect(grid.get(3, 2)).toBe(initialValue);
    expect(grid.get(0, 0)).toBe(initialValue);

    // Test another position
    grid.set(9, 9, 99);
    expect(grid.get(9, 9)).toBe(99);
  });

  it('should correctly expose its internal width and height', () => {
    expect(grid.width).toBe(10);
    expect(grid.height).toBe(10);
  });

  it('should return undefined or throw if coordinates are out of bounds when getting', () => {
    expect(() => grid.get(-1, 0)).toThrow('Out of bounds');
    expect(() => grid.get(0, -1)).toThrow('Out of bounds');
    expect(() => grid.get(10, 0)).toThrow('Out of bounds');
    expect(() => grid.get(0, 10)).toThrow('Out of bounds');
    expect(() => grid.get(15, 15)).toThrow('Out of bounds');
  });

  it('should throw if coordinates are out of bounds when setting', () => {
    expect(() => grid.set(-1, 0, 1)).toThrow('Out of bounds');
    expect(() => grid.set(0, -1, 1)).toThrow('Out of bounds');
    expect(() => grid.set(10, 0, 1)).toThrow('Out of bounds');
    expect(() => grid.set(0, 10, 1)).toThrow('Out of bounds');
    expect(() => grid.set(15, 15, 1)).toThrow('Out of bounds');
  });
});
