/**
 * Utility functions for image loading
 */

/**
 * Extracts domain from URL
 * @param url - URL to extract domain from
 * @returns Domain name or empty string if invalid
 */
export function extractDomain(url: string): string {
  try {
    const urlObject = new URL(url);

    return urlObject.hostname.toLowerCase();
  } catch {
    return "";
  }
}

/**
 * Ensures URL has proper protocol
 * @param url - URL to normalize
 * @param defaultProtocol - Default protocol to use (default: https)
 * @returns URL with protocol
 */
export function ensureProtocol(url: string, defaultProtocol = "https"): string {
  if (url.startsWith("//")) {
    return `${defaultProtocol}:${url}`;
  }
  
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return `${defaultProtocol}://${url}`;
  }
  
  return url;
}

/**
 * Validates image loader configuration
 * @param config - Image loader configuration
 * @throws Error if configuration is invalid
 */
export function validateConfig(config: { src: string; width?: number; quality?: number }): void {
  if (!config.src) {
    throw new Error("Image source URL is required");
  }
  
  if (config.width !== undefined && config.width <= 0) {
    throw new Error("Image width must be a positive number");
  }
  
  if (config.quality !== undefined && (config.quality < 1 || config.quality > 100)) {
    throw new Error("Image quality must be between 1 and 100");
  }
}

/**
 * Normalizes configuration with defaults
 * @param config - Image loader configuration
 * @param defaultQuality - Default quality to use
 * @returns Normalized configuration
 */
export function normalizeConfig(
  config: { src: string; width?: number; quality?: number },
  defaultQuality = 75
): { src: string; width: number; quality: number } {
  return {
    quality: config.quality ?? defaultQuality,
    src: config.src,
    width: config.width ?? 800,
  };
}
