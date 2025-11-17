import type { ImageLoaderProps } from "next/image";

export function thumborLoader({ quality = 75, src, width }: ImageLoaderProps): string {
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
