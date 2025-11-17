import type { ImageLoaderProps } from "next/image";

import { urlCache } from "@/utils/url-cache";

export function fastlyLoader({ quality = 75, src, width }: ImageLoaderProps): string {
  const url = urlCache.getClone(src);

  if (!url) {
    return src;
  }

  url.searchParams.set("auto", "webp");
  url.searchParams.set("width", width.toString());
  url.searchParams.set("quality", quality.toString());

  return url.toString();
}
