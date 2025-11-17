import type { ImageLoaderProps } from "next/image";

export function cloudflareLoader({ quality = 75, src, width }: ImageLoaderProps): string {
  try {
    const url = new URL(src);
    const params = [`width=${width}`, `quality=${quality}`, "format=auto"];
    const transformedPath = `/cdn-cgi/image/${params.join(",")}${url.pathname}`;

    url.pathname = transformedPath;

    return url.toString();
  } catch {
    return src;
  }
}
