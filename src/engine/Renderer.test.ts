import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Renderer } from './Renderer';
import { Application } from 'pixi.js';

describe('Renderer', () => {
  let container: HTMLDivElement;
  let renderer: Renderer;

  beforeEach(() => {
    // Set up a mock DOM environment
    container = document.createElement('div');
    container.id = 'app';
    document.body.appendChild(container);

    // Mock window dimensions
    vi.stubGlobal('innerWidth', 800);
    vi.stubGlobal('innerHeight', 600);
  });

  afterEach(() => {
    // Clean up
    if (renderer) {
      renderer.destroy();
    }
    document.body.removeChild(container);
    vi.unstubAllGlobals();
  });

  it('should initialize the PixiJS Application and attach it to the provided container', async () => {
    renderer = new Renderer();
    await renderer.init(container);

    expect(renderer.app).toBeInstanceOf(Application);
    expect(container.children.length).toBe(1);
    expect(container.children[0].tagName).toBe('CANVAS');
  });

  it('separates the camera-moved world from screen-fixed UI', () => {
    renderer = new Renderer();
    return renderer.init(container).then(() => {
      // An overlay parented to the world would scroll away with the camera.
      expect(renderer.app.stage.children).toEqual([renderer.world, renderer.ui]);
    });
  });

  it('renders at the display pixel density instead of being upscaled', () => {
    renderer = new Renderer();
    return renderer.init(container).then(() => {
      expect(renderer.app.renderer.resolution).toBe(window.devicePixelRatio || 1);
    });
  });

  it('should set the renderer dimensions to the window dimensions upon initialization', async () => {
    renderer = new Renderer();
    await renderer.init(container);

    expect(renderer.screenWidth).toBe(800);
    expect(renderer.screenHeight).toBe(600);
  });

  it('should update the application renderer dimensions when a resize event is dispatched', async () => {
    renderer = new Renderer();
    await renderer.init(container);

    // Change global dimensions
    vi.stubGlobal('innerWidth', 1024);
    vi.stubGlobal('innerHeight', 768);

    // Dispatch resize event
    window.dispatchEvent(new Event('resize'));

    // Wait a tick for resize event to be processed if it's asynchronous
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(renderer.screenWidth).toBe(1024);
    expect(renderer.screenHeight).toBe(768);
  });

  it('defaults texture sampling to nearest-neighbour for pixel art', async () => {
    renderer = new Renderer();
    await renderer.init(container);

    const { TextureSource } = await import('pixi.js');
    const source = new TextureSource();
    expect(source.style.scaleMode).toBe('nearest');
  });
});
