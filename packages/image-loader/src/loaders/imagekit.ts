import type { ImageLoaderProps } from "next/image";

export function imagekitLoader({ quality = 75, src, width }: ImageLoaderProps): string {
  try {
    const url = new URL(src);
    const params = [`w-${width}`, `q-${quality}`];

    url.searchParams.set("tr", params.join(","));

    return url.toString();
  } catch {
    return src;
  }
}
