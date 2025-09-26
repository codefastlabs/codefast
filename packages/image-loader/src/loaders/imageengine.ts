import type { ImageLoaderProps } from "next/image";

/**
 * ImageEngine URL transformation
 * Handles ImageEngine CDN
 *
 * @example
 * ```text
 * https://example.com/image.jpg
 * → https://example.com/image.jpg?imgeng=/w_800/cmpr_20
 * ```
 */
export function imageengineLoader({ quality = 80, src, width }: ImageLoaderProps): string {
  try {
    const compression = 100 - quality;
    const params = [`w_${width}`, `cmpr_${compression}`];
    const imgengParameter = `/${params.join("/")}`;

    const url = new URL(src);

    url.searchParams.set("imgeng", imgengParameter);

    return url.toString();
  } catch {
    return src;
  }
}
