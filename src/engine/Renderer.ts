import { Application } from 'pixi.js';

export class Renderer {
  public app: Application;

  constructor() {
    this.app = new Application();
  }

  public async init(container: HTMLElement): Promise<void> {
    await this.app.init({
      width: window.innerWidth,
      height: window.innerHeight,
      resizeTo: window,
    });

    container.appendChild(this.app.canvas);
  }

  public destroy(): void {
    this.app.destroy(true, { children: true, texture: true });
  }
}
