import { Assets, Texture } from 'pixi.js';

export interface ArtPack {
  tiles?: Record<string, string>;
  entities?: Record<string, string>;
}

/**
 * AssetLoader — manages texture loading, caching, and dimension validation.
 *
 * Tier 1 (Engine). It knows how to load images into PixiJS textures, asserts
 * that sprites match the required tile dimensions, and provides cached textures
 * to view builders.
 */
export class AssetLoader {
  private static textures = new Map<string, Texture>();

  /** Retrieves a loaded texture by its sprite key. */
  public static get(key: string): Texture | undefined {
    return this.textures.get(key);
  }

  /**
   * Registers a loaded texture under a key, strictly validating that its
   * dimensions are a whole multiple of the tile size.
   */
  public static register(key: string, texture: Texture, tileSize: number): void {
    const width = texture.width;
    const height = texture.height;

    if (width % tileSize !== 0 || height % tileSize !== 0 || width === 0 || height === 0) {
      throw new Error(
        `Sprite "${key}" dimensions (${width}x${height}) must be a whole multiple of tile size (${tileSize})`,
      );
    }

    this.textures.set(key, texture);
  }

  /** Checks whether a sprite is loaded and registered. */
  public static has(key: string): boolean {
    return this.textures.has(key);
  }

  /** Clears all cached textures (used between runs/tests). */
  public static clear(): void {
    this.textures.clear();
  }

  /**
   * Loads a sprite texture from a URL or file path. If loading fails, logs a
   * console warning and returns null per the Graceful Failure rule.
   */
  public static async load(key: string, url: string, tileSize: number): Promise<Texture | null> {
    try {
      const texture = await Assets.load<Texture>(url);
      if (texture) {
        this.register(key, texture, tileSize);
        return texture;
      }
      console.warn(`[AssetLoader] Failed to load sprite "${key}" from "${url}"`);
      return null;
    } catch (err) {
      console.warn(`[AssetLoader] Error loading sprite "${key}" from "${url}":`, err);
      return null;
    }
  }

  /**
   * Loads all sprites declared in a Tier 3 Art Pack.
   */
  public static async loadArtPack(pack: ArtPack, tileSize: number): Promise<void> {
    const promises: Promise<Texture | null>[] = [];

    if (pack.tiles) {
      for (const [key, url] of Object.entries(pack.tiles)) {
        promises.push(this.load(key, url, tileSize));
      }
    }

    if (pack.entities) {
      for (const [key, url] of Object.entries(pack.entities)) {
        promises.push(this.load(key, url, tileSize));
      }
    }

    await Promise.all(promises);
  }
}
