import type { ImageLoaderProps } from "next/image";

import { DEFAULT_IMAGE_QUALITY } from "@/constants";
import { urlCache } from "@/utils/url-cache";

export function pixelbinLoader({ quality = DEFAULT_IMAGE_QUALITY, src, width }: ImageLoaderProps): string {
  const url = urlCache.getClone(src);

  if (!url) {
    return src;
  }

  const cloudName = url.hostname.split(".")[0];
  const opt = `t.resize(w:${width})~t.compress(q:${quality})`;
  const transformedPath = `/v2/${cloudName}/${opt}${url.pathname}`;

  url.hostname = "cdn.pixelbin.io";
  url.pathname = transformedPath;
  url.searchParams.set("f_auto", "true");

  return url.toString();
}
