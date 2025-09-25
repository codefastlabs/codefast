import type { ImageLoaderProps } from "next/image";

import queryString from "query-string";

import type { ImageLoaderFunction, LoaderDefinition } from "./types";

import { extractDomain, normalizeConfig, validateConfig } from "./utils";

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
 */
export const builtInLoaders: LoaderDefinition[] = [
  {
    canHandle: (src: string) => extractDomain(src).endsWith(".cloudinary.com"),
    load: cloudinaryLoader,
    name: "cloudinary",
  },
  {
    canHandle: (src: string) => extractDomain(src) === "images.unsplash.com",
    load: unsplashLoader,
    name: "unsplash",
  },
  {
    canHandle: (src: string) => extractDomain(src).endsWith(".imgix.net"),
    load: imgixLoader,
    name: "imgix",
  },
  {
    canHandle: (src: string) => extractDomain(src).endsWith(".cloudfront.net"),
    load: awsCloudFrontLoader,
    name: "aws-cloudfront",
  },
  {
    canHandle: (src: string) => extractDomain(src).endsWith(".supabase.co"),
    load: supabaseLoader,
    name: "supabase",
  },
];
