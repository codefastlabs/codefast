/**
 * Loaders barrel exports
 * 
 * Organized by category for better clarity:
 * - built-in: Main CDN loaders (cloudinary, unsplash, imgix, etc.)
 * - extended: Additional CDN loaders (cloudflare, contentful, etc.)
 */

// Built-in loaders (main CDN providers)
export {
  allLoaders,
  awsCloudFrontLoader,
  builtInLoaders,
  cloudinaryLoader,
  extendedLoaders,
  imgixLoader,
  supabaseLoader,
  unsplashLoader,
} from "./built-in";

// Extended loaders (additional CDN providers)
export {
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
} from "./extended";
