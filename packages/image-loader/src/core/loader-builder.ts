import type { ImageLoaderFunction, LoaderDefinition } from "@/types";

/**
 * Utility functions for creating optimized loader definitions
 */
export const LoaderDefinitionBuilder = {
  /**
   * Create a loader definition with optimized domain matching
   */
  create(
    name: string,
    domainPattern: RegExp | string,
    loader: ImageLoaderFunction,
  ): LoaderDefinition {
    const compiledPattern =
      typeof domainPattern === "string" ? new RegExp(domainPattern) : domainPattern;

    return {
      canHandle: (src: string): boolean => {
        try {
          const url = new URL(src);

          return compiledPattern.test(url.hostname.toLowerCase());
        } catch {
          return false;
        }
      },
      load: loader,
      name,
    };
  },

  /**
   * Create a loader definition for exact domain matching
   */
  forDomain(name: string, domain: string, loader: ImageLoaderFunction): LoaderDefinition {
    return this.create(name, `^${domain.replaceAll(".", String.raw`\.`)}$`, loader);
  },

  /**
   * Create a loader definition for subdomain matching
   */
  forSubdomain(name: string, domain: string, loader: ImageLoaderFunction): LoaderDefinition {
    return this.create(name, `.*\\.${domain.replaceAll(".", String.raw`\.`)}$`, loader);
  },

  /**
   * Create a loader definition with custom matching logic
   */
  withCustomMatcher(
    name: string,
    matcher: (src: string) => boolean,
    loader: ImageLoaderFunction,
  ): LoaderDefinition {
    return {
      canHandle: matcher,
      load: loader,
      name,
    };
  },
};
