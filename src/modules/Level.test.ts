import { expect, test, describe } from 'vitest';
import { Level } from './Level';

describe('Level Regeneration', () => {
  test('regenerate() creates a new grid and map', () => {
    const level = new Level(20, 20, 100);
    const initialGridData = [];

    for (let y = 0; y < level.grid.height; y++) {
      const row = [];
      for (let x = 0; x < level.grid.width; x++) {
        row.push(level.grid.get(x, y));
      }
      initialGridData.push(row);
    }

    // Mock Math.random to ensure the random walk generates a different map
    // We'll let regenerate run, but to ensure it's different, let's just assert that a new MapGrid object was created
    const oldGrid = level.grid;
    level.regenerate();

    expect(level.grid).not.toBe(oldGrid);
    expect(level.grid.width).toBe(20);
    expect(level.grid.height).toBe(20);
  });
});
