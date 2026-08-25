/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
      // main.ts is bootstrap wiring with no logic of its own; the game rules it
      // used to hold now live in FloorManager, which is covered directly.
      exclude: ['src/**/*.test.ts', 'src/main.ts'],
    },
  },
});
