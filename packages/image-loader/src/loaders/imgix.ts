import type { ImageLoaderProps } from "next/image";

/**
 * Imgix URL transformation
 * Handles *.imgix.net domains
 *
 * @example
 * ```text
 * https://example.imgix.net/image.jpg
 * → https://example.imgix.net/image.jpg?auto=format&q=80&w=800
 * ```
 */
export function imgixLoader({ quality = 80, src, width }: ImageLoaderProps): string {
  try {
    const url = new URL(src);

    url.searchParams.set("auto", "format");
    url.searchParams.set("q", quality.toString());
    url.searchParams.set("w", width.toString());

    return url.toString();
  } catch {
    return src;
  }
}
