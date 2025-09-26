import type { ImageLoaderProps } from "next/image";

import { createCustomImageLoader, createImageLoader, imageLoader, ImageLoader } from "..";

describe("Image Loader", () => {
  describe("Default imageLoader function", () => {
    it("should transform Cloudinary URLs correctly", () => {
      const config: ImageLoaderProps = {
        quality: 75,
        src: "https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg",
        width: 800,
      };

      const result = imageLoader(config);

      expect(result).toContain("w_800");
      expect(result).toContain("q_75");
      expect(result).toContain("f_auto");
      expect(result).toContain("c_fill");
    });

    it("should transform Imgix URLs correctly", () => {
      const config: ImageLoaderProps = {
        quality: 85,
        src: "https://example.imgix.net/image.jpg",
        width: 400,
      };

      const result = imageLoader(config);

      expect(result).toContain("w=400");
      expect(result).toContain("q=85");
      expect(result).toContain("auto=format");
    });

    it("should transform Unsplash URLs correctly", () => {
      const config: ImageLoaderProps = {
        quality: 80,
        src: "https://images.unsplash.com/photo-1234567890",
        width: 600,
      };

      const result = imageLoader(config);

      expect(result).toContain("w=600");
      expect(result).toContain("q=80");
      expect(result).toContain("fm=auto");
      expect(result).toContain("fit=crop");
    });

    it("should fallback to original URL for unknown domains", () => {
      const config: ImageLoaderProps = {
        quality: 60,
        src: "https://example.com/image.jpg",
        width: 200,
      };

      const result = imageLoader(config);

      expect(result).toBe(config.src);
    });

    it("should use default quality when not specified", () => {
      const config: ImageLoaderProps = {
        src: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        width: 800,
      };

      const result = imageLoader(config);

      expect(result).toContain("q_80"); // Default quality is 80
    });

    it("should handle malformed URLs gracefully", () => {
      const config: ImageLoaderProps = {
        quality: 75,
        src: "not-a-valid-url",
        width: 800,
      };

      const result = imageLoader(config);

      expect(result).toBe(config.src);
    });
  });

  describe("Custom image loader", () => {
    it("should create custom loader with specific loaders", () => {
      const customLoader = createCustomImageLoader({
        fallbackLoader: ({ src }): string => `${src}?fallback=true`,
        loaders: [
          {
            loader: ({ quality = 80, src, width }): string => `${src}?w=${width}&q=${quality}`,
            matcher: (src): boolean => src.includes("cloudinary.com"),
            name: "cloudinary",
          },
        ],
      });

      const config: ImageLoaderProps = {
        quality: 75,
        src: "https://res.cloudinary.com/demo/image.jpg",
        width: 800,
      };

      const result = customLoader(config);

      expect(result).toBe("https://res.cloudinary.com/demo/image.jpg?w=800&q=75");
    });

    it("should use fallback loader for unmatched URLs", () => {
      const customLoader = createCustomImageLoader({
        fallbackLoader: ({ src }): string => `${src}?fallback=true`,
        loaders: [
          {
            loader: ({ src }): string => `${src}?matched`,
            matcher: (src): boolean => src.includes("cloudinary.com"),
            name: "cloudinary",
          },
        ],
      });

      const config: ImageLoaderProps = {
        src: "https://example.com/image.jpg",
        width: 800,
      };

      const result = customLoader(config);

      expect(result).toBe("https://example.com/image.jpg?fallback=true");
    });
  });

  describe("ImageLoader class", () => {
    it("should create instance with default loaders", () => {
      const loader = new ImageLoader();

      expect(loader.getRegisteredLoaders()).toHaveLength(0);
    });

    it("should register and use custom loaders", () => {
      const loader = new ImageLoader([
        {
          loader: ({ src, width }): string => `${src}?w=${width}`,
          matcher: (src): boolean => src.includes("test.com"),
          name: "test",
        },
      ]);

      expect(loader.hasLoader("test")).toBe(true);
      expect(loader.getRegisteredLoaders()).toContain("test");

      const result = loader.transform({
        src: "https://test.com/image.jpg",
        width: 800,
      });

      expect(result).toBe("https://test.com/image.jpg?w=800");
    });

    it("should handle multiple loaders in order", () => {
      const loader = new ImageLoader([
        {
          loader: ({ src }): string => `${src}?first`,
          matcher: (src): boolean => src.includes("test.com"),
          name: "first",
        },
        {
          loader: ({ src }): string => `${src}?second`,
          matcher: (src): boolean => src.includes("test.com"),
          name: "second",
        },
      ]);

      const result = loader.transform({
        src: "https://test.com/image.jpg",
        width: 800,
      });

      // Should use the first matching loader
      expect(result).toBe("https://test.com/image.jpg?first");
    });
  });

  describe("Performance", () => {
    it("should handle large number of loaders efficiently", () => {
      const manyLoaders = Array.from({ length: 100 }, (_, index) => ({
        loader: ({ src }: ImageLoaderProps): string => `${src}?loader=${index}`,
        matcher: (src: string): boolean => src.includes(`domain-${index}.com`),
        name: `loader-${index}`,
      }));

      const loader = createImageLoader(manyLoaders);

      const start = performance.now();
      const result = loader.transform({
        src: "https://domain-50.com/image.jpg",
        width: 800,
      });
      const end = performance.now();

      expect(result).toBe("https://domain-50.com/image.jpg?loader=50");
      expect(end - start).toBeLessThan(10); // Should be very fast
    });
  });
});
