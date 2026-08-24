import { describe, it, expect, beforeEach } from 'vitest';
import { Camera } from './Camera';
import { Container } from 'pixi.js';
import { Entity } from './Entity';

// A simple mock entity for testing
class MockEntity extends Entity {
  constructor(id: string, x: number, y: number) {
    super(id, x, y);
  }

  update(_dt: number): void {
    // No-op for tests
  }
}

describe('Camera', () => {
  let stage: Container;
  let camera: Camera;
  const screenWidth = 800;
  const screenHeight = 600;

  beforeEach(() => {
    stage = new Container();
    camera = new Camera(stage, screenWidth, screenHeight);
  });

  it('should not update stage pivot or position if no target is set', () => {
    const initialPivotX = stage.pivot.x;
    const initialPivotY = stage.pivot.y;
    const initialPosX = stage.position.x;
    const initialPosY = stage.position.y;

    camera.update();

    expect(stage.pivot.x).toBe(initialPivotX);
    expect(stage.pivot.y).toBe(initialPivotY);
    expect(stage.position.x).toBe(initialPosX);
    expect(stage.position.y).toBe(initialPosY);
  });

  it('should perfectly update stage pivot to match target position', () => {
    const target = new MockEntity('target-1', 150, 250);
    camera.setTarget(target);
    camera.update();

    expect(stage.pivot.x).toBe(150);
    expect(stage.pivot.y).toBe(250);
  });

  it('should update stage position to keep target centered', () => {
    const target = new MockEntity('target-1', 150, 250);
    camera.setTarget(target);
    camera.update();

    expect(stage.position.x).toBe(screenWidth / 2);
    expect(stage.position.y).toBe(screenHeight / 2);
  });

  it('should update position correctly after a resize', () => {
    const target = new MockEntity('target-1', 100, 100);
    camera.setTarget(target);

    const newWidth = 1024;
    const newHeight = 768;
    camera.resize(newWidth, newHeight);
    camera.update();

    expect(stage.position.x).toBe(newWidth / 2);
    expect(stage.position.y).toBe(newHeight / 2);
  });
});
