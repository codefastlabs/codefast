import type { ImageLoaderProps } from "next/image";

/**
 * Default URL transformation
 * Generic loader that adds width and quality query parameters to any URL
 *
 * This loader serves as a fallback for URLs that don't match any specific
 * CDN provider patterns. It adds `w` (width) and `q` (quality) query parameters
 * to the URL, which is useful for simple image optimization servers.
 *
 * @example
 * ```text
 * https://example.com/image.jpg
 * → https://example.com/image.jpg?w=800&q=75
 * ```
 */
export function defaultLoader({ quality = 75, src, width }: ImageLoaderProps): string {
  try {
    const url = new URL(src);

    url.searchParams.set("w", width.toString());
    url.searchParams.set("q", quality.toString());

    return url.toString();
  } catch {
    // If URL parsing fails, return the original src
    return src;
  }
}
