import type { ImageLoaderProps } from "next/image";

export function fastlyLoader({ quality = 75, src, width }: ImageLoaderProps): string {
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
