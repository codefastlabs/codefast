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
import { isDomainMatch, isPathMatch } from "@/utils/url-matcher";

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
    matcher: (src) => isDomainMatch(src, "cloudinary.com"),
    name: "cloudinary.com",
  },
  {
    domain: "imgix.net",
    loader: imgixLoader,
    matcher: (src) => isDomainMatch(src, "imgix.net"),
    name: "imgix.net",
  },
  {
    domain: "images.unsplash.com",
    loader: unsplashLoader,
    matcher: (src) => isDomainMatch(src, "images.unsplash.com"),
    name: "images.unsplash.com",
  },
  {
    domain: "cloudfront.net",
    loader: cloudfrontLoader,
    matcher: (src) => isDomainMatch(src, "cloudfront.net"),
    name: "cloudfront.net",
  },
  {
    domain: "supabase.co",
    loader: supabaseLoader,
    matcher: (src) => isDomainMatch(src, "supabase.co"),
    name: "supabase.co",
  },
  {
    domain: "ctfassets.net",
    loader: contentfulLoader,
    matcher: (src) => isDomainMatch(src, "ctfassets.net"),
    name: "ctfassets.net",
  },
  {
    domain: "imagekit.io",
    loader: imagekitLoader,
    matcher: (src) => isDomainMatch(src, "imagekit.io"),
    name: "imagekit.io",
  },
  {
    domain: "cdn.sanity.io",
    loader: sanityLoader,
    matcher: (src) => isDomainMatch(src, "cdn.sanity.io"),
    name: "cdn.sanity.io",
  },
  {
    domain: "pixelbin.io",
    loader: pixelbinLoader,
    matcher: (src) => isDomainMatch(src, "pixelbin.io"),
    name: "pixelbin.io",
  },

  {
    loader: cloudflareLoader,
    matcher: (src) => isDomainMatch(src, "cloudflare.com") || isPathMatch(src, "/cdn-cgi/image/"),
    name: "cloudflare",
  },
  {
    loader: fastlyLoader,
    matcher: (src) => isDomainMatch(src, "fastly.com") || isDomainMatch(src, "fastlylb.net"),
    name: "fastly",
  },
  {
    loader: gumletLoader,
    matcher: (src) => isDomainMatch(src, "gumlet.io"),
    name: "gumlet",
  },
  {
    loader: imageengineLoader,
    matcher: (src) => isDomainMatch(src, "imageengine.io") || isPathMatch(src, "imgeng"),
    name: "imageengine",
  },
  {
    loader: sirvLoader,
    matcher: (src) => isDomainMatch(src, "sirv.com"),
    name: "sirv",
  },
  {
    loader: thumborLoader,
    matcher: (src) => isPathMatch(src, "thumbor"),
    name: "thumbor",
  },
];

