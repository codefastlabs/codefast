import type { ImageLoaderProps } from "next/image";

import { urlCache } from "@/utils/url-cache";

export function defaultLoader({ quality = 75, src, width }: ImageLoaderProps): string {
  const url = urlCache.getClone(src);

  if (!url) {
    return src;
  }

  url.searchParams.set("w", width.toString());
  url.searchParams.set("q", quality.toString());

  return url.toString();
}
