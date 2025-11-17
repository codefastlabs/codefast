import type { ImageLoaderProps } from "next/image";

import { DEFAULT_IMAGE_QUALITY } from "@/constants";
import { urlCache } from "@/utils/url-cache";

export function cloudinaryLoader({ quality = DEFAULT_IMAGE_QUALITY, src, width }: ImageLoaderProps): string {
  const url = urlCache.getClone(src);

  if (!url) {
    return src;
  }

  const pathParts = url.pathname.split("/");
  const uploadIndex = pathParts.indexOf("upload");

  if (uploadIndex === -1) {
    return src;
  }

  const transformations = [`w_${width}`, `q_${quality}`, "f_auto", "c_fill"];
  const newPathParts = [
    ...pathParts.slice(0, uploadIndex + 1),
    transformations.join(","),
    ...pathParts.slice(uploadIndex + 1),
  ];

  url.pathname = newPathParts.join("/");

  return url.toString();
}
