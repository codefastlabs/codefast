import type { ImageLoaderProps } from "next/image";

import queryString from "query-string";

import type { ImageLoaderFunction, LoaderDefinition } from "./types";

import { LoaderDefinitionBuilder } from "./core/loader-builder";
// Import extended loaders
import {
  cloudflareLoader,
  contentfulLoader,
  fastlyLoader,
  gumletLoader,
  imageEngineLoader,
  imageKitLoader,
  pixelBinLoader,
  sanityLoader,
  sirvLoader,
  thumborLoader,
} from "./loaders/extended-loaders";
import { normalizeConfig, validateConfig } from "./utils";

/**
 * Cloudinary image loader
 * Handles images from *.cloudinary.com domains
 */
export const cloudinaryLoader: ImageLoaderFunction = (config: ImageLoaderProps): string => {
  validateConfig(config);
  const { quality = 75, src, width } = normalizeConfig(config);
  
  try {
    const url = new URL(src);
    const pathParts = url.pathname.split("/");
    
    // Find the upload segment to insert transformations
    const uploadIndex = pathParts.indexOf("upload");
    
    if (uploadIndex === -1) {
      console.warn(`Invalid Cloudinary URL structure: ${src}`);

      return src;
    }
    
    // Build transformation parameters
    const transformations = [
      `w_${width}`,
      `q_${quality}`,
      "f_auto",
      "c_fill"
    ];
    
    // Insert transformations after upload
    const newPathParts = [
      ...pathParts.slice(0, uploadIndex + 1),
      transformations.join(","),
      ...pathParts.slice(uploadIndex + 1),
    ];
    
    url.pathname = newPathParts.join("/");

    return url.toString();
  } catch (error) {
    console.warn(`Failed to transform Cloudinary URL: ${src}`, error);

    return src;
  }
};

/**
 * Unsplash image loader
 * Handles images from images.unsplash.com
 */
export const unsplashLoader: ImageLoaderFunction = (config: ImageLoaderProps): string => {
  validateConfig(config);
  const { quality = 75, src, width } = normalizeConfig(config);
  
  try {
    const params = {
      fit: "crop",
      fm: "auto",
      q: quality,
      w: width
    };
    
    return queryString.stringifyUrl({ query: params, url: src });
  } catch (error) {
    console.warn(`Failed to transform Unsplash URL: ${src}`, error);

    return src;
  }
};

/**
 * Imgix image loader
 * Handles images from *.imgix.net domains
 */
export const imgixLoader: ImageLoaderFunction = (config: ImageLoaderProps): string => {
  validateConfig(config);
  const { quality = 75, src, width } = normalizeConfig(config);
  
  try {
    const params = {
      auto: "format",
      q: quality,
      w: width
    };
    
    return queryString.stringifyUrl({ query: params, url: src });
  } catch (error) {
    console.warn(`Failed to transform Imgix URL: ${src}`, error);

    return src;
  }
};

/**
 * AWS CloudFront image loader
 * Handles images from *.cloudfront.net domains
 */
export const awsCloudFrontLoader: ImageLoaderFunction = (config: ImageLoaderProps): string => {
  validateConfig(config);
  const { quality = 75, src, width } = normalizeConfig(config);
  
  try {
    const params = {
      f: "auto",
      q: quality,
      w: width
    };
    
    return queryString.stringifyUrl({ query: params, url: src });
  } catch (error) {
    console.warn(`Failed to transform AWS CloudFront URL: ${src}`, error);

    return src;
  }
};

/**
 * Supabase storage loader
 * Handles images from *.supabase.co domains
 */
export const supabaseLoader: ImageLoaderFunction = (config: ImageLoaderProps): string => {
  validateConfig(config);
  const { quality = 75, src, width } = normalizeConfig(config);
  
  try {
    const params = {
      format: "auto",
      quality: quality,
      width: width
    };
    
    return queryString.stringifyUrl({ query: params, url: src });
  } catch (error) {
    console.warn(`Failed to transform Supabase URL: ${src}`, error);

    return src;
  }
};

/**
 * Built-in loader definitions
 * Registry of all default loaders with their matching logic
 * Uses optimized builder pattern for better performance
 */
export const builtInLoaders: LoaderDefinition[] = [
  LoaderDefinitionBuilder.forSubdomain("cloudinary", "cloudinary.com", cloudinaryLoader),
  LoaderDefinitionBuilder.forDomain("unsplash", "images.unsplash.com", unsplashLoader),
  LoaderDefinitionBuilder.forSubdomain("imgix", "imgix.net", imgixLoader),
  LoaderDefinitionBuilder.forSubdomain("aws-cloudfront", "cloudfront.net", awsCloudFrontLoader),
  LoaderDefinitionBuilder.forSubdomain("supabase", "supabase.co", supabaseLoader),
];

/**
 * Extended loader definitions
 * Additional loaders for more CDN providers
 */
export const extendedLoaders: LoaderDefinition[] = [
  LoaderDefinitionBuilder.withCustomMatcher(
    "cloudflare",
    (src: string) => {
      try {
        const url = new URL(src);

        return url.hostname.includes("cloudflare") || src.includes("/cdn-cgi/image/");
      } catch {
        return false;
      }
    },
    cloudflareLoader
  ),
  LoaderDefinitionBuilder.forSubdomain("contentful", "ctfassets.net", contentfulLoader),
  LoaderDefinitionBuilder.withCustomMatcher(
    "fastly",
    (src: string) => {
      try {
        const url = new URL(src);

        return url.hostname.includes("fastly") || src.includes("fastly");
      } catch {
        return false;
      }
    },
    fastlyLoader
  ),
  LoaderDefinitionBuilder.withCustomMatcher(
    "gumlet",
    (src: string) => {
      try {
        const url = new URL(src);

        return url.hostname.includes("gumlet") || src.includes("gumlet");
      } catch {
        return false;
      }
    },
    gumletLoader
  ),
  LoaderDefinitionBuilder.withCustomMatcher(
    "imageengine",
    (src: string) => {
      try {
        const url = new URL(src);

        return url.hostname.includes("imageengine") || src.includes("imgeng");
      } catch {
        return false;
      }
    },
    imageEngineLoader
  ),
  LoaderDefinitionBuilder.forSubdomain("pixelbin", "pixelbin.io", pixelBinLoader),
  LoaderDefinitionBuilder.forSubdomain("sanity", "sanity.io", sanityLoader),
  LoaderDefinitionBuilder.withCustomMatcher(
    "sirv",
    (src: string) => {
      try {
        const url = new URL(src);

        return url.hostname.includes("sirv") || src.includes("sirv");
      } catch {
        return false;
      }
    },
    sirvLoader
  ),
  LoaderDefinitionBuilder.withCustomMatcher(
    "thumbor",
    (src: string) => {
      try {
        const url = new URL(src);

        return url.hostname.includes("thumbor") || src.includes("thumbor");
      } catch {
        return false;
      }
    },
    thumborLoader
  ),
  LoaderDefinitionBuilder.forSubdomain("imagekit", "imagekit.io", imageKitLoader),
];

/**
 * All available loaders (built-in + extended)
 */
export const allLoaders: LoaderDefinition[] = [...builtInLoaders, ...extendedLoaders];
