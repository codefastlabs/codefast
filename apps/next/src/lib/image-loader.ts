import type { ImageLoaderProps } from "next/image";
import { createCustomImageLoader, defaultLoaderConfigs } from "@codefast/image-loader";

const fallbackLoader = ({ src, width, quality }: ImageLoaderProps): string => {
  try {
    const url = new URL(src);
    url.searchParams.set("w", width.toString());
    url.searchParams.set("q", (quality ?? 75).toString());
    return url.toString();
  } catch {
    return src;
  }
};

const loader = createCustomImageLoader({
  loaders: defaultLoaderConfigs,
  fallbackLoader,
});

export default loader;
