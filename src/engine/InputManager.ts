export interface InputState {
  /** Keys held down right now. */
  keys: { [key: string]: boolean };
  /**
   * Keys that went down since the last frame boundary, whether or not they are
   * still held. A tap shorter than one frame is invisible to `keys` alone, so
   * anything edge-triggered — interacting, attacking, opening a menu — must
   * read this instead or it will silently drop inputs.
   */
  justPressed: { [key: string]: boolean };
  mouse: {
    x: number;
    y: number;
    left: boolean;
    right: boolean;
  };
}

export class InputManager {
  private keys: { [key: string]: boolean } = {};
  private justPressed: { [key: string]: boolean } = {};
  private mouse = {
    x: 0,
    y: 0,
    left: false,
    right: false,
  };

  constructor() {
    this.attachListeners();
  }

  private attachListeners() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
    window.addEventListener('contextmenu', this.handleContextMenu);
  }

  private detachListeners() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('contextmenu', this.handleContextMenu);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    // Browsers repeat keydown while a key is held; only the first is an edge.
    if (!this.keys[key]) this.justPressed[key] = true;
    this.keys[key] = true;
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys[e.key.toLowerCase()] = false;
  };

  private handleMouseMove = (e: MouseEvent) => {
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
  };

  private handleMouseDown = (e: MouseEvent) => {
    if (e.button === 0) {
      this.mouse.left = true;
    } else if (e.button === 2) {
      this.mouse.right = true;
    }
  };

  private handleMouseUp = (e: MouseEvent) => {
    if (e.button === 0) {
      this.mouse.left = false;
    } else if (e.button === 2) {
      this.mouse.right = false;
    }
  };

  private handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
  };

  public getState(): InputState {
    return {
      keys: { ...this.keys },
      justPressed: { ...this.justPressed },
      mouse: { ...this.mouse },
    };
  }

  /**
   * Clears the one-frame edge state. Call once per frame, after everything that
   * reads input has run.
   */
  public endFrame(): void {
    this.justPressed = {};
  }

  public destroy() {
    this.detachListeners();
  }
}
