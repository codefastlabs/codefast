import type { ImageLoaderProps } from "next/image";

/**
 * Fastly URL transformation
 * Handles Fastly CDN
 *
 * @example
 * ```text
 * https://example.com/image.jpg
 * → https://example.com/image.jpg?auto=webp&width=800&quality=80
 * ```
 */
export function fastlyLoader({ quality = 80, src, width }: ImageLoaderProps): string {
  try {
    const url = new URL(src);

    url.searchParams.set("auto", "webp");
    url.searchParams.set("width", width.toString());
    url.searchParams.set("quality", quality.toString());

    return url.toString();
  } catch {
    return src;
  }
}
