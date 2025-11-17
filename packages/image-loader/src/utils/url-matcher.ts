/**
 * URL matching utilities for secure domain and path validation
 *
 * These utilities prevent domain spoofing attacks by using proper URL parsing
 * instead of simple string matching.
 */

/**
 * Safely checks if a URL contains a specific domain
 * Uses URL parsing to prevent domain spoofing attacks
 *
 * @param url - The URL to check
 * @param domain - The domain to match against
 * @returns True if the URL's hostname matches the domain
 *
 * @example
 * ```text
 * isDomainMatch("https://res.cloudinary.com/image.jpg", "cloudinary.com") // true
 * isDomainMatch("https://evil-cloudinary.com.evil.com/image.jpg", "cloudinary.com") // false
 * ```
 */
export function isDomainMatch(url: string, domain: string): boolean {
  try {
    const urlObject = new URL(url);

    return urlObject.hostname === domain || urlObject.hostname.endsWith(`.${domain}`);
  } catch {
    return false;
  }
}

/**
 * Safely checks if a URL contains a specific substring in the path
 * Only checks the pathname portion to prevent domain spoofing
 *
 * @param url - The URL to check
 * @param substring - The substring to search for in the path
 * @returns True if the pathname contains the substring
 *
 * @example
 * ```text
 * isPathMatch("https://example.com/cdn-cgi/image/transform", "/cdn-cgi/image/") // true
 * isPathMatch("https://evil.com/cdn-cgi/image/transform", "/cdn-cgi/image/") // true
 * ```
 */
export function isPathMatch(url: string, substring: string): boolean {
  try {
    const urlObject = new URL(url);

    return urlObject.pathname.includes(substring);
  } catch {
    return false;
  }
}

