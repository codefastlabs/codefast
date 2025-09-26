import type { ImageLoaderProps } from "next/image";

/**
 * Contentful URL transformation
 * Handles *.ctfassets.net domains
 *
 * @example
 * ```text
 * https://images.ctfassets.net/space/image.jpg
 * → https://images.ctfassets.net/space/image.jpg?fm=webp&w=800&q=80
 * ```
 */
export function contentfulLoader({ quality = 80, src, width }: ImageLoaderProps): string {
  try {
    const url = new URL(src);

    url.searchParams.set("fm", "webp");
    url.searchParams.set("w", width.toString());
    url.searchParams.set("q", quality.toString());

    return url.toString();
  } catch {
    return src;
  }
}
