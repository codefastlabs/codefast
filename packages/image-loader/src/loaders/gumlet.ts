import type { ImageLoaderProps } from "next/image";

/**
 * Gumlet URL transformation
 * Handles Gumlet CDN
 *
 * @example
 * ```text
 * https://example.com/image.jpg
 * → https://example.com/image.jpg?format=auto&w=800&q=80
 * ```
 */
export function gumletLoader({ quality = 80, src, width }: ImageLoaderProps): string {
  try {
    const url = new URL(src);

    url.searchParams.set("format", "auto");
    url.searchParams.set("w", width.toString());
    url.searchParams.set("q", quality.toString());

    return url.toString();
  } catch {
    return src;
  }
}
