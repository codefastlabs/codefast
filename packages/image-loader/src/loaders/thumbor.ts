import type { ImageLoaderProps } from "next/image";

import { urlCache } from "@/utils/url-cache";

export function thumborLoader({ quality = 75, src, width }: ImageLoaderProps): string {
  const url = urlCache.getClone(src);

  if (!url) {
    return src;
  }

  const params = [`${width}x0`, `filters:quality(${quality})`];
  const transformedPath = `/${params.join("/")}${url.pathname}`;

  url.pathname = transformedPath;

  return url.toString();
}
