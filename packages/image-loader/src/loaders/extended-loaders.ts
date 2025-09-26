import type { ImageLoaderProps } from "next/image";

import type { ImageLoaderFunction } from "@/types";

// Note: validateConfig and normalizeConfig removed - Next.js handles validation

/**
 * Cloudflare image loader
 * Handles images from Cloudflare CDN with automatic optimization
 *
 * @example
 * ```text
 * https://example.com/image.jpg -> https://example.com/cdn-cgi/image/width=800,quality=75,format=auto/image.jpg
 * ```
 */
export const cloudflareLoader: ImageLoaderFunction = (config: ImageLoaderProps): string => {
  const { quality = 75, src, width = 800 } = config;

  try {
    const url = new URL(src);
    const params = [`width=${width}`, `quality=${quality}`, "format=auto"];
    const transformedPath = `/cdn-cgi/image/${params.join(",")}${url.pathname}`;

    url.pathname = transformedPath;

    return url.toString();
  } catch (error) {
    console.warn(`Failed to transform Cloudflare URL: ${src}`, error);

    return src;
  }
};

/**
 * Contentful image loader
 * Handles images from Contentful CDN
 *
 * @example
 * ```text
 * https://images.ctfassets.net/space/image.jpg -> https://images.ctfassets.net/space/image.jpg?fm=webp&w=800&q=75
 * ```
 */
export const contentfulLoader: ImageLoaderFunction = (config: ImageLoaderProps): string => {
  const { quality = 75, src, width = 800 } = config;

  try {
    const url = new URL(src);

    url.searchParams.set("fm", "webp");
    url.searchParams.set("w", width.toString());
    url.searchParams.set("q", quality.toString());

    return url.toString();
  } catch (error) {
    console.warn(`Failed to transform Contentful URL: ${src}`, error);

    return src;
  }
};

/**
 * Fastly image loader
 * Handles images from Fastly CDN
 *
 * @example
 * ```text
 * https://example.com/image.jpg -> https://example.com/image.jpg?auto=webp&width=800&quality=75
 * ```
 */
export const fastlyLoader: ImageLoaderFunction = (config: ImageLoaderProps): string => {
  const { quality = 75, src, width = 800 } = config;

  try {
    const url = new URL(src);

    url.searchParams.set("auto", "webp");
    url.searchParams.set("width", width.toString());
    url.searchParams.set("quality", quality.toString());

    return url.toString();
  } catch (error) {
    console.warn(`Failed to transform Fastly URL: ${src}`, error);

    return src;
  }
};

/**
 * Gumlet image loader
 * Handles images from Gumlet CDN
 *
 * @example
 * ```text
 * https://example.com/image.jpg -> https://example.com/image.jpg?format=auto&w=800&q=75
 * ```
 */
export const gumletLoader: ImageLoaderFunction = (config: ImageLoaderProps): string => {
  const { quality = 75, src, width = 800 } = config;

  try {
    const url = new URL(src);

    url.searchParams.set("format", "auto");
    url.searchParams.set("w", width.toString());
    url.searchParams.set("q", quality.toString());

    return url.toString();
  } catch (error) {
    console.warn(`Failed to transform Gumlet URL: ${src}`, error);

    return src;
  }
};

/**
 * ImageEngine loader
 * Handles images from ImageEngine CDN
 *
 * @example
 * ```text
 * https://example.com/image.jpg -> https://example.com/image.jpg?imgeng=/w_800/cmpr_25
 * ```
 */
export const imageEngineLoader: ImageLoaderFunction = (config: ImageLoaderProps): string => {
  const { quality = 75, src, width = 800 } = config;

  try {
    const compression = 100 - quality;
    const params = [`w_${width}`, `cmpr_${compression}`];
    const imgengParameter = `/${params.join("/")}`;

    const url = new URL(src);

    url.searchParams.set("imgeng", imgengParameter);

    return url.toString();
  } catch (error) {
    console.warn(`Failed to transform ImageEngine URL: ${src}`, error);

    return src;
  }
};

/**
 * PixelBin loader
 * Handles images from PixelBin CDN
 *
 * @example
 * ```text
 * https://example.com/image.jpg -> https://cdn.pixelbin.io/v2/cloud-name/t.resize(w:800)~t.compress(q:75)/image.jpg?f_auto=true
 * ```
 */
export const pixelBinLoader: ImageLoaderFunction = (config: ImageLoaderProps): string => {
  const { quality = 75, src, width = 800 } = config;

  try {
    const url = new URL(src);
    const cloudName = url.hostname.split(".")[0]; // Extract cloud name from hostname
    const opt = `t.resize(w:${width})~t.compress(q:${quality})`;
    const transformedPath = `/v2/${cloudName}/${opt}${url.pathname}`;

    url.hostname = "cdn.pixelbin.io";
    url.pathname = transformedPath;
    url.searchParams.set("f_auto", "true");

    return url.toString();
  } catch (error) {
    console.warn(`Failed to transform PixelBin URL: ${src}`, error);

    return src;
  }
};

/**
 * Sanity image loader
 * Handles images from Sanity CDN
 *
 * @example
 * ```text
 * https://cdn.sanity.io/images/project/dataset/image.jpg -> https://cdn.sanity.io/images/project/dataset/image.jpg?auto=format&fit=max&w=800&q=75
 * ```
 */
export const sanityLoader: ImageLoaderFunction = (config: ImageLoaderProps): string => {
  const { quality = 75, src, width = 800 } = config;

  try {
    const url = new URL(src);

    url.searchParams.set("auto", "format");
    url.searchParams.set("fit", "max");
    url.searchParams.set("w", width.toString());

    url.searchParams.set("q", quality.toString());

    return url.toString();
  } catch (error) {
    console.warn(`Failed to transform Sanity URL: ${src}`, error);

    return src;
  }
};

/**
 * Sirv image loader
 * Handles images from Sirv CDN
 *
 * @example
 * ```text
 * https://example.com/image.jpg -> https://example.com/image.jpg?format=optimal&w=800&q=85
 * ```
 */
export const sirvLoader: ImageLoaderFunction = (config: ImageLoaderProps): string => {
  const { quality = 85, src, width = 800 } = config;

  try {
    const url = new URL(src);
    const params = url.searchParams;

    params.set("format", params.getAll("format").join(",") || "optimal");
    params.set("w", params.get("w") ?? width.toString());
    params.set("q", quality.toString());

    return url.toString();
  } catch (error) {
    console.warn(`Failed to transform Sirv URL: ${src}`, error);

    return src;
  }
};

/**
 * Thumbor image loader
 * Handles images from Thumbor service
 *
 * @example
 * ```text
 * https://example.com/image.jpg -> https://example.com/800x0/filters:quality(75)/image.jpg
 * ```
 */
export const thumborLoader: ImageLoaderFunction = (config: ImageLoaderProps): string => {
  const { quality = 75, src, width = 800 } = config;

  try {
    const url = new URL(src);
    const params = [`${width}x0`, `filters:quality(${quality})`];
    const transformedPath = `/${params.join("/")}${url.pathname}`;

    url.pathname = transformedPath;

    return url.toString();
  } catch (error) {
    console.warn(`Failed to transform Thumbor URL: ${src}`, error);

    return src;
  }
};

/**
 * ImageKit loader
 * Handles images from ImageKit CDN
 *
 * @example
 * ```text
 * https://ik.imagekit.io/id/image.jpg -> https://ik.imagekit.io/id/image.jpg?tr=w-800,q-80
 * ```
 */
export const imageKitLoader: ImageLoaderFunction = (config: ImageLoaderProps): string => {
  const { quality = 80, src, width = 800 } = config;

  try {
    const params = [`w-${width}`, `q-${quality}`];
    const url = new URL(src);

    url.searchParams.set("tr", params.join(","));

    return url.toString();
  } catch (error) {
    console.warn(`Failed to transform ImageKit URL: ${src}`, error);

    return src;
  }
};
