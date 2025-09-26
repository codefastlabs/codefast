import type { ImageLoaderProps } from "next/image";

/**
 * ImageKit URL transformation
 * Handles *.imagekit.io domains
 *
 * @example
 * ```text
 * https://ik.imagekit.io/id/image.jpg
 * → https://ik.imagekit.io/id/image.jpg?tr=w-800,q-80
 * ```
 */
export function imagekitLoader({ quality = 80, src, width }: ImageLoaderProps): string {
  try {
    const url = new URL(src);
    const params = [`w-${width}`, `q-${quality}`];

    url.searchParams.set("tr", params.join(","));

    return url.toString();
  } catch {
    return src;
  }
}
