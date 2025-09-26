/**
 * Utility functions for image loading
 * 
 * These utilities focus on CDN-specific operations that are not handled by Next.js:
 * - URL protocol normalization for CDN URLs
 * - Domain extraction for loader matching
 * 
 * Note: Configuration validation is handled by Next.js built-in type checking
 * and runtime validation, so we don't duplicate that functionality here.
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
