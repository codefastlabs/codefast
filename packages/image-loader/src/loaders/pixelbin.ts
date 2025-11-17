import type { ImageLoaderProps } from "next/image";

export function pixelbinLoader({ quality = 75, src, width }: ImageLoaderProps): string {
  try {
    const url = new URL(src);
    const cloudName = url.hostname.split(".")[0];
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
