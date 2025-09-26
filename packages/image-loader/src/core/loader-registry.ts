import type { LoaderConfig } from "@/core/types";

import {
  cloudflareLoader,
  cloudfrontLoader,
  cloudinaryLoader,
  contentfulLoader,
  fastlyLoader,
  gumletLoader,
  imageengineLoader,
  imagekitLoader,
  imgixLoader,
  pixelbinLoader,
  sanityLoader,
  sirvLoader,
  supabaseLoader,
  thumborLoader,
  unsplashLoader,
} from "@/loaders";

/**
 * Default loader configurations
 *
 * Each loader has a name, matcher function, and loader function
 * Matcher functions use efficient string matching for performance
 */
export const defaultLoaderConfigs: LoaderConfig[] = [
  {
    loader: cloudinaryLoader,
    matcher: (src) => src.includes("cloudinary.com"),
    name: "cloudinary.com",
  },
  {
    loader: imgixLoader,
    matcher: (src) => src.includes("imgix.net"),
    name: "imgix.net",
  },
  {
    loader: unsplashLoader,
    matcher: (src) => src.includes("images.unsplash.com"),
    name: "images.unsplash.com",
  },
  {
    loader: cloudfrontLoader,
    matcher: (src) => src.includes("cloudfront.net"),
    name: "cloudfront.net",
  },
  {
    loader: supabaseLoader,
    matcher: (src) => src.includes("supabase.co"),
    name: "supabase.co",
  },
  {
    loader: contentfulLoader,
    matcher: (src) => src.includes("ctfassets.net"),
    name: "ctfassets.net",
  },
  {
    loader: imagekitLoader,
    matcher: (src) => src.includes("imagekit.io"),
    name: "imagekit.io",
  },
  {
    loader: sanityLoader,
    matcher: (src) => src.includes("cdn.sanity.io"),
    name: "cdn.sanity.io",
  },
  {
    loader: cloudflareLoader,
    matcher: (src) => src.includes("cloudflare") || src.includes("/cdn-cgi/image/"),
    name: "cloudflare",
  },
  {
    loader: fastlyLoader,
    matcher: (src) => src.includes("fastly"),
    name: "fastly",
  },
  {
    loader: gumletLoader,
    matcher: (src) => src.includes("gumlet"),
    name: "gumlet",
  },
  {
    loader: imageengineLoader,
    matcher: (src) => src.includes("imageengine") || src.includes("imgeng"),
    name: "imageengine",
  },
  {
    loader: pixelbinLoader,
    matcher: (src) => src.includes("pixelbin.io"),
    name: "pixelbin.io",
  },
  {
    loader: sirvLoader,
    matcher: (src) => src.includes("sirv"),
    name: "sirv",
  },
  {
    loader: thumborLoader,
    matcher: (src) => src.includes("thumbor"),
    name: "thumbor",
  },
];

/**
 * Create a loader registry from configurations
 */
export function createLoaderRegistry(
  configs: LoaderConfig[] = defaultLoaderConfigs,
): Map<string, LoaderConfig> {
  const registry = new Map<string, LoaderConfig>();

  for (const config of configs) {
    registry.set(config.name, config);
  }

  return registry;
}
