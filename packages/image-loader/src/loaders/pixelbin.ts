import type { ImageLoaderProps } from "next/image";

/**
 * PixelBin URL transformation
 * Handles PixelBin CDN
 *
 * @example
 * ```text
 * https://example.com/image.jpg
 * → https://cdn.pixelbin.io/v2/cloud-name/t.resize(w:800)~t.compress(q:80)/image.jpg?f_auto=true
 * ```
 */
export function pixelbinLoader({ quality = 80, src, width }: ImageLoaderProps): string {
  try {
    const url = new URL(src);
    const cloudName = url.hostname.split(".")[0]; // Extract cloud name from hostname
    const opt = `t.resize(w:${width})~t.compress(q:${quality})`;
    const transformedPath = `/v2/${cloudName}/${opt}${url.pathname}`;

    url.hostname = "cdn.pixelbin.io";
    url.pathname = transformedPath;
    url.searchParams.set("f_auto", "true");

    return url.toString();
  } catch {
    return src;
  }
}
