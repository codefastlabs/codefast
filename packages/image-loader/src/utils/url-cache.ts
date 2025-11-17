/**
 * URL cache to avoid creating multiple URL objects for the same URL string.
 * This improves performance when the same URL is processed multiple times
 * (e.g., in matchers and loaders).
 */
class URLCache {
  private readonly cache = new Map<string, URL>();

  /**
   * Get or create a URL object for the given URL string.
   * Returns undefined if the URL string is invalid.
   * Note: The returned URL object should not be modified directly if it is reused.
   * Use `getClone()` if you need to modify the URL.
   */
  get(urlString: string): undefined | URL {
    if (this.cache.has(urlString)) {
      return this.cache.get(urlString);
    }

    try {
      const url = new URL(urlString);

      this.cache.set(urlString, url);

      return url;
    } catch {
      return undefined;
    }
  }

  /**
   * Get a clone of the cached URL object (or create and cache a new one).
   * Use this when you need to modify the URL object.
   * Returns undefined if the URL string is invalid.
   */
  getClone(urlString: string): undefined | URL {
    const cached = this.get(urlString);

    if (!cached) {
      return undefined;
    }

    // Clone the URL by creating a new one from the string representation
    // This ensures we have a fresh, mutable copy
    return new URL(cached.toString());
  }

  /**
   * Clear the cache.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get the current cache size.
   */
  size(): number {
    return this.cache.size;
  }
}

// Export a singleton instance
export const urlCache = new URLCache();
