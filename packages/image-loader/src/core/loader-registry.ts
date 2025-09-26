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
 * Default loader configurations with domain optimization
 *
 * Each loader has a name, matcher function, loader function, and domain
 * Domain field enables O(1) lookup optimization for better performance
 */
export const defaultLoaderConfigs: LoaderConfig[] = [
  {
    domain: "cloudinary.com",
    loader: cloudinaryLoader,
    matcher: (src) => src.includes("cloudinary.com"),
    name: "cloudinary.com",
  },
  {
    domain: "imgix.net",
    loader: imgixLoader,
    matcher: (src) => src.includes("imgix.net"),
    name: "imgix.net",
  },
  {
    domain: "images.unsplash.com",
    loader: unsplashLoader,
    matcher: (src) => src.includes("images.unsplash.com"),
    name: "images.unsplash.com",
  },
  {
    domain: "cloudfront.net",
    loader: cloudfrontLoader,
    matcher: (src) => src.includes("cloudfront.net"),
    name: "cloudfront.net",
  },
  {
    domain: "supabase.co",
    loader: supabaseLoader,
    matcher: (src) => src.includes("supabase.co"),
    name: "supabase.co",
  },
  {
    domain: "ctfassets.net",
    loader: contentfulLoader,
    matcher: (src) => src.includes("ctfassets.net"),
    name: "ctfassets.net",
  },
  {
    domain: "imagekit.io",
    loader: imagekitLoader,
    matcher: (src) => src.includes("imagekit.io"),
    name: "imagekit.io",
  },
  {
    domain: "cdn.sanity.io",
    loader: sanityLoader,
    matcher: (src) => src.includes("cdn.sanity.io"),
    name: "cdn.sanity.io",
  },
  {
    loader: cloudflareLoader,
    matcher: (src) => src.includes("cloudflare") || src.includes("/cdn-cgi/image/"),
    name: "cloudflare",
    // No domain: complex matcher requires fallback to linear search
  },
  {
    loader: fastlyLoader,
    matcher: (src) => src.includes("fastly"),
    name: "fastly",
    // No domain: generic matcher requires fallback to linear search
  },
  {
    loader: gumletLoader,
    matcher: (src) => src.includes("gumlet"),
    name: "gumlet",
    // No domain: generic matcher requires fallback to linear search
  },
  {
    loader: imageengineLoader,
    matcher: (src) => src.includes("imageengine") || src.includes("imgeng"),
    name: "imageengine",
    // No domain: complex matcher requires fallback to linear search
  },
  {
    domain: "pixelbin.io",
    loader: pixelbinLoader,
    matcher: (src) => src.includes("pixelbin.io"),
    name: "pixelbin.io",
  },
  {
    loader: sirvLoader,
    matcher: (src) => src.includes("sirv"),
    name: "sirv",
    // No domain: generic matcher requires fallback to linear search
  },
  {
    loader: thumborLoader,
    matcher: (src) => src.includes("thumbor"),
    name: "thumbor",
    // No domain: generic matcher requires fallback to linear search
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
