import type { ImageLoaderProps } from "next/image";

/**
 * Thumbor URL transformation
 * Handles Thumbor service
 *
 * @example
 * ```text
 * https://example.com/image.jpg
 * → https://example.com/800x0/filters:quality(80)/image.jpg
 * ```
 */
export function thumborLoader({ quality = 80, src, width }: ImageLoaderProps): string {
  try {
    const url = new URL(src);
    const params = [`${width}x0`, `filters:quality(${quality})`];
    const transformedPath = `/${params.join("/")}${url.pathname}`;

    url.pathname = transformedPath;

    return url.toString();
  } catch {
    return src;
  }
}
