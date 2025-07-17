import type { CDNProvider, ImageLoader, ImageLoaderFactoryConfig } from "@/types";

const getProviderDescription = (provider: CDNProvider): string => {
  switch (provider) {
    case "aws-cloudfront": {
      return "Amazon CloudFront CDN";
    }

    case "cloudinary": {
      return "Cloudinary image optimization";
    }

    case "imgix": {
      return "Imgix image processing";
    }

    case "supabase": {
      return "Supabase storage";
    }

    case "unsplash": {
      return "Unsplash photo service";
    }

    default: {
      // This should never be reached with proper typing
      return provider;
    }
  }
};

const processConfig = (config: ImageLoaderFactoryConfig): string => {
  const quality = config.defaultQuality ?? 75;
  const mappingCount = config.domainMappings ? Object.keys(config.domainMappings).length : 0;

  return `Quality: ${quality.toString()}, Mappings: ${mappingCount.toString()}`;
};

describe("types", () => {
  describe("CDNProvider type", () => {
    it("should accept valid CDN provider values", () => {
      const awsProvider: CDNProvider = "aws-cloudfront";
      const cloudinaryProvider: CDNProvider = "cloudinary";
      const imgixProvider: CDNProvider = "imgix";
      const supabaseProvider: CDNProvider = "supabase";
      const unsplashProvider: CDNProvider = "unsplash";

      expect(awsProvider).toBe("aws-cloudfront");
      expect(cloudinaryProvider).toBe("cloudinary");
      expect(imgixProvider).toBe("imgix");
      expect(supabaseProvider).toBe("supabase");
      expect(unsplashProvider).toBe("unsplash");
    });

    it("should be usable in arrays and objects", () => {
      const providers: CDNProvider[] = ["aws-cloudfront", "cloudinary", "imgix", "supabase", "unsplash"];
      const providerMap: Record<CDNProvider, string> = {
        "aws-cloudfront": "AWS CloudFront",
        cloudinary: "Cloudinary",
        imgix: "Imgix",
        supabase: "Supabase",
        unsplash: "Unsplash",
      };

      expect(providers).toHaveLength(5);
      expect(providerMap.cloudinary).toBe("Cloudinary");
      expect(Object.keys(providerMap)).toHaveLength(5);
    });

    it("should work with switch statements", () => {
      expect(getProviderDescription("cloudinary")).toBe("Cloudinary image optimization");
      expect(getProviderDescription("imgix")).toBe("Imgix image processing");
    });
  });

  describe("ImageLoader interface", () => {
    it("should define the correct method signatures", () => {
      const mockLoader: ImageLoader = {
        canHandle: jest.fn().mockReturnValue(true),
        getName: jest.fn().mockReturnValue("test-loader"),
        load: jest.fn().mockReturnValue("https://example.com/image.jpg"),
      };

      expect(typeof mockLoader.load).toBe("function");
      expect(typeof mockLoader.canHandle).toBe("function");
      expect(typeof mockLoader.getName).toBe("function");
    });

    it("should work with load method implementation", () => {
      const mockLoader: ImageLoader = {
        canHandle: (source) => source.includes("example.com"),
        getName: () => "example-loader",
        load: ({ quality, src, width }) => {
          return `${src}?w=${width.toString()}&q=${quality?.toString() ?? ''}`;
        },
      };

      const result = mockLoader.load({ quality: 75, src: "https://example.com/image.jpg", width: 800 });

      expect(result).toBe("https://example.com/image.jpg?w=800&q=75");
      expect(mockLoader.canHandle("https://example.com/test.jpg")).toBe(true);
      expect(mockLoader.canHandle("https://other.com/test.jpg")).toBe(false);
      expect(mockLoader.getName()).toBe("example-loader");
    });

    it("should be implementable by classes", () => {
      class TestLoader implements ImageLoader {
        load({ quality, src, width }: { src: string; width: number; quality?: number }): string {
          return `${src}?w=${width.toString()}${quality ? `&q=${quality.toString()}` : ""}`;
        }

        canHandle(source: string): boolean {
          return source.startsWith("https://test.com");
        }

        getName(): string {
          return "test-loader";
        }
      }

      const loader = new TestLoader();

      expect(loader.load({ src: "https://test.com/image.jpg", width: 600 })).toBe("https://test.com/image.jpg?w=600");
      expect(loader.load({ quality: 80, src: "https://test.com/image.jpg", width: 600 })).toBe(
        "https://test.com/image.jpg?w=600&q=80",
      );
      expect(loader.canHandle("https://test.com/image.jpg")).toBe(true);
      expect(loader.canHandle("https://other.com/image.jpg")).toBe(false);
      expect(loader.getName()).toBe("test-loader");
    });

    it("should work with arrays of loaders", () => {
      const loader1: ImageLoader = {
        canHandle: jest.fn().mockReturnValue(true),
        getName: jest.fn().mockReturnValue("loader1"),
        load: jest.fn(),
      };

      const loader2: ImageLoader = {
        canHandle: jest.fn().mockReturnValue(false),
        getName: jest.fn().mockReturnValue("loader2"),
        load: jest.fn(),
      };

      const loaders: ImageLoader[] = [loader1, loader2];
      const activeLoader = loaders.find((loader) => loader.canHandle("https://example.com/image.jpg"));

      expect(activeLoader).toBe(loader1);
      expect(activeLoader?.getName()).toBe("loader1");
    });
  });

  describe("ImageLoaderFactoryConfig interface", () => {
    it("should accept valid configuration objects", () => {
      const config1: ImageLoaderFactoryConfig = {
        defaultQuality: 80,
      };

      const config2: ImageLoaderFactoryConfig = {
        domainMappings: {
          "example.com": "cdn.example.com",
          "test.org": "assets.test.org",
        },
      };

      const config3: ImageLoaderFactoryConfig = {
        defaultQuality: 90,
        domainMappings: {
          "demo.com": "static.demo.com",
        },
      };

      expect(config1.defaultQuality).toBe(80);
      expect(config2.domainMappings).toEqual({
        "example.com": "cdn.example.com",
        "test.org": "assets.test.org",
      });
      expect(config3.defaultQuality).toBe(90);
      expect(config3.domainMappings?.["demo.com"]).toBe("static.demo.com");
    });

    it("should accept empty configuration", () => {
      const emptyConfig: ImageLoaderFactoryConfig = {};

      expect(emptyConfig).toEqual({});
    });

    it("should work with optional properties", () => {
      const configWithQuality: ImageLoaderFactoryConfig = {
        defaultQuality: 85,
      };

      const configWithMappings: ImageLoaderFactoryConfig = {
        domainMappings: {
          "api.example.com": "cdn.example.com",
        },
      };

      expect(configWithQuality.defaultQuality).toBe(85);
      expect(configWithQuality.domainMappings).toBeUndefined();
      expect(configWithMappings.defaultQuality).toBeUndefined();
      expect(configWithMappings.domainMappings).toEqual({
        "api.example.com": "cdn.example.com",
      });
    });

    it("should work in function parameters", () => {
      expect(processConfig({})).toBe("Quality: 75, Mappings: 0");
      expect(processConfig({ defaultQuality: 90 })).toBe("Quality: 90, Mappings: 0");
      expect(
        processConfig({
          domainMappings: { "a.com": "b.com", "c.com": "d.com" },
        }),
      ).toBe("Quality: 75, Mappings: 2");
      expect(
        processConfig({
          defaultQuality: 85,
          domainMappings: { "example.com": "cdn.example.com" },
        }),
      ).toBe("Quality: 85, Mappings: 1");
    });
  });

  describe("type integration", () => {
    it("should work together in realistic scenarios", () => {
      type LoaderRegistry = Record<string, ImageLoader>;

      const createLoaderRegistry = (providers: CDNProvider[], config: ImageLoaderFactoryConfig): LoaderRegistry => {
        const registry: LoaderRegistry = {};

        for (const provider of providers) {
          registry[provider] = {
            canHandle: (source): boolean => source.includes(provider),
            getName: (): CDNProvider => provider,
            load: ({ quality, src, width }): string => {
              const q = quality ?? config.defaultQuality ?? 75;

              return `${src}?provider=${provider}&w=${width.toString()}&q=${q.toString()}`;
            },
          };
        }

        return registry;
      };

      const providers: CDNProvider[] = ["cloudinary", "imgix"];
      const config: ImageLoaderFactoryConfig = { defaultQuality: 80 };
      const registry = createLoaderRegistry(providers, config);

      expect(Object.keys(registry)).toEqual(["cloudinary", "imgix"]);
      expect(registry.cloudinary.getName()).toBe("cloudinary");
      expect(registry.cloudinary.load({ src: "https://cloudinary.com/image.jpg", width: 800 })).toBe(
        "https://cloudinary.com/image.jpg?provider=cloudinary&w=800&q=80",
      );
    });
  });
});
