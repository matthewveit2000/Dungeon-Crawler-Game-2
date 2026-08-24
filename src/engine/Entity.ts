import { Container } from 'pixi.js';

export abstract class Entity {
  public id: string;
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public sprite: Container;

  constructor(id: string, x: number = 0, y: number = 0) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.width = 0;
    this.height = 0;
    this.sprite = new Container();
  }

  abstract update(dt: number): void;
}
