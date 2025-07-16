import type { ImageLoaderProps } from "next/image";

import type { ImageLoader, ImageLoaderFactoryConfig } from "@/types";

/**
 * Factory class for managing and selecting image loaders
 * Implements the Factory pattern and follows the Dependency Inversion Principle
 */
export class ImageLoaderFactory {
  private readonly loaders: ImageLoader[] = [];
  private readonly config: ImageLoaderFactoryConfig;

  constructor(config: ImageLoaderFactoryConfig = {}) {
    this.config = {
      defaultQuality: 75,
      ...config,
    };
  }

  /**
   * Registers a new image loader
   * Follows the Open/Closed Principle - new loaders can be added without modifying existing code
   */
  public registerLoader(loader: ImageLoader): void {
    if (this.loaders.some((l) => l.getName() === loader.getName())) {
      throw new Error(`Loader with name "${loader.getName()}" is already registered`);
    }
    this.loaders.push(loader);
  }

  /**
   * Registers multiple image loaders at once
   */
  public registerLoaders(loaders: ImageLoader[]): void {
    for (const loader of loaders) {
      this.registerLoader(loader);
    }
  }

  /**
   * Unregisters an image loader by name
   */
  public unregisterLoader(name: string): boolean {
    const index = this.loaders.findIndex((loader) => loader.getName() === name);
    if (index !== -1) {
      this.loaders.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Gets all registered loaders
   */
  public getLoaders(): readonly ImageLoader[] {
    return [...this.loaders];
  }

  /**
   * Finds the appropriate loader for a given source URL
   * Returns the first loader that can handle the URL
   */
  public findLoader(source: string): ImageLoader | null {
    // Check domain mappings first
    const domain = this.extractDomain(source);
    if (this.config.domainMappings?.[domain]) {
      const mappedLoaderName = this.config.domainMappings[domain];
      const mappedLoader = this.loaders.find((loader) => loader.getName() === mappedLoaderName);
      if (mappedLoader) {
        return mappedLoader;
      }
    }

    // Find the first loader that can handle the URL
    return this.loaders.find((loader) => loader.canHandle(source)) ?? null;
  }

  /**
   * Loads an image using the appropriate loader
   * Main entry point for image loading
   */
  public load(config: ImageLoaderProps): string {
    const loader = this.findLoader(config.src);

    if (!loader) {
      // Fallback: return the original URL if no loader can handle it
      console.warn(`No loader found for URL: ${config.src}. Returning original URL.`);
      return config.src;
    }

    return loader.load({
      ...config,
      quality: config.quality ?? this.config.defaultQuality,
    });
  }

  /**
   * Creates a Next.js compatible image loader function
   * This function can be used directly in Next.js configuration
   */
  public createNextImageLoader() {
    return (params: ImageLoaderProps): string => {
      return this.load({
        quality: params.quality,
        src: params.src,
        width: params.width,
      });
    };
  }

  /**
   * Gets loader statistics
   * Useful for debugging and monitoring
   */
  public getStats(): {
    totalLoaders: number;
    loaderNames: string[];
    domainMappings: Record<string, string>;
  } {
    return {
      domainMappings: this.config.domainMappings ?? {},
      loaderNames: this.loaders.map((loader) => loader.getName()),
      totalLoaders: this.loaders.length,
    };
  }

  /**
   * Clears all registered loaders
   * Useful for testing or reconfiguration
   */
  public clear(): void {
    this.loaders.length = 0;
  }

  /**
   * Utility method to extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      const urlObject = new URL(url);
      return urlObject.hostname.toLowerCase();
    } catch {
      return "";
    }
  }
}

/**
 * Default factory instance
 * Singleton pattern for convenience
 */
export const defaultImageLoaderFactory = new ImageLoaderFactory();
