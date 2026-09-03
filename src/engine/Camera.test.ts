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

  it('correctly maps screen coordinates to world coordinates', () => {
    const target = new MockEntity('target', 100, 200);
    camera.setTarget(target);
    camera.setZoom(2);

    // Screen center (400, 300) should map to target world position (100, 200)
    const centerWorld = camera.screenToWorld(400, 300);
    expect(centerWorld.x).toBe(100);
    expect(centerWorld.y).toBe(200);

    // +20px screen at zoom 2 is +10px in world
    const offsetWorld = camera.screenToWorld(420, 300);
    expect(offsetWorld.x).toBe(110);
    expect(offsetWorld.y).toBe(200);
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

  it('should support integer camera zoom and scale the stage', () => {
    const zoomedCamera = new Camera(stage, screenWidth, screenHeight, 2);
    expect(zoomedCamera.getZoom()).toBe(2);
    expect(stage.scale.x).toBe(2);
    expect(stage.scale.y).toBe(2);
  });

  it('should allow dynamically changing zoom via setZoom', () => {
    camera.setZoom(4);
    expect(camera.getZoom()).toBe(4);
    expect(stage.scale.x).toBe(4);
    expect(stage.scale.y).toBe(4);
  });

  it('should reject non-integer or invalid zoom values', () => {
    expect(() => camera.setZoom(1.5)).toThrow(/integer/i);
    expect(() => camera.setZoom(0)).toThrow();
    expect(() => camera.setZoom(-1)).toThrow();
    expect(() => new Camera(stage, screenWidth, screenHeight, 2.5)).toThrow(/integer/i);
  });

  it('should snap stage pivot to whole pixels even when target has fractional coordinates', () => {
    const target = new MockEntity('target-1', 150.4, 250.7);
    camera.setTarget(target);
    camera.update();

    expect(stage.pivot.x).toBe(150);
    expect(stage.pivot.y).toBe(251);
    expect(Number.isInteger(stage.pivot.x)).toBe(true);
    expect(Number.isInteger(stage.pivot.y)).toBe(true);
  });

  it('should snap stage position to whole pixels even with odd screen dimensions', () => {
    const oddCamera = new Camera(stage, 801, 601, 2);
    const target = new MockEntity('target-1', 100, 100);
    oddCamera.setTarget(target);
    oddCamera.update();

    expect(stage.position.x).toBe(401);
    expect(stage.position.y).toBe(301);
    expect(Number.isInteger(stage.position.x)).toBe(true);
    expect(Number.isInteger(stage.position.y)).toBe(true);
  });
});
