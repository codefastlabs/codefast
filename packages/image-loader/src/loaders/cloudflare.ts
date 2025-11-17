import type { ImageLoaderProps } from "next/image";

import { urlCache } from "@/utils/url-cache";

export function cloudflareLoader({ quality = 75, src, width }: ImageLoaderProps): string {
  const url = urlCache.getClone(src);

  if (!url) {
    return src;
  }

  const params = [`width=${width}`, `quality=${quality}`, "format=auto"];
  const transformedPath = `/cdn-cgi/image/${params.join(",")}${url.pathname}`;

  url.pathname = transformedPath;

  return url.toString();
}
