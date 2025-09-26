import type { ImageLoaderProps } from "next/image";

/**
 * Sanity URL transformation
 * Handles cdn.sanity.io domains
 *
 * @example
 * ```text
 * https://cdn.sanity.io/images/project/dataset/image.jpg
 * → https://cdn.sanity.io/images/project/dataset/image.jpg?auto=format&fit=max&w=800&q=80
 * ```
 */
export function sanityLoader({ quality = 80, src, width }: ImageLoaderProps): string {
  try {
    const url = new URL(src);

    url.searchParams.set("auto", "format");
    url.searchParams.set("fit", "max");
    url.searchParams.set("w", width.toString());
    url.searchParams.set("q", quality.toString());

    return url.toString();
  } catch {
    return src;
  }
}
