import type { ImageLoaderProps } from "next/image";

import { createImageLoader, defaultImageLoader } from "..";

const customLoader = (config: ImageLoaderProps): string => {
  if (config.src.includes("custom.com")) {
    return `${config.src}?w=${config.width}&q=${config.quality ?? 75}`;
  }

  throw new Error("Not a custom URL");
};

const faultyLoader = (): string => {
  throw new Error("Loader error");
};

describe("Image Loader", () => {
  describe("createImageLoader", () => {
    it("should create a loader function", () => {
      const loader = createImageLoader();

      expect(typeof loader).toBe("function");
    });

    it("should handle Cloudinary URLs", () => {
      const loader = createImageLoader();
      const config = {
        quality: 75,
        src: "https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg",
        width: 800,
      };

      const result = loader(config);

      expect(result).toContain("w_800");
      expect(result).toContain("q_75");
      expect(result).toContain("f_auto");
      expect(result).toContain("c_fill");
    });

    it("should handle Unsplash URLs", () => {
      const loader = createImageLoader();
      const config = {
        quality: 80,
        src: "https://images.unsplash.com/photo-1234567890",
        width: 600,
      };

      const result = loader(config);

      expect(result).toContain("w=600");
      expect(result).toContain("q=80");
      expect(result).toContain("fm=auto");
      expect(result).toContain("fit=crop");
    });

    it("should handle Imgix URLs", () => {
      const loader = createImageLoader();
      const config = {
        quality: 85,
        src: "https://example.imgix.net/image.jpg",
        width: 400,
      };

      const result = loader(config);

      expect(result).toContain("w=400");
      expect(result).toContain("q=85");
      expect(result).toContain("auto=format");
    });

    it("should handle AWS CloudFront URLs", () => {
      const loader = createImageLoader();
      const config = {
        quality: 90,
        src: "https://d1234567890.cloudfront.net/image.jpg",
        width: 300,
      };

      const result = loader(config);

      expect(result).toContain("w=300");
      expect(result).toContain("q=90");
      expect(result).toContain("f=auto");
    });

    it("should handle Supabase URLs", () => {
      const loader = createImageLoader();
      const config = {
        quality: 70,
        src: "https://xyz.supabase.co/storage/v1/object/public/bucket/image.jpg",
        width: 500,
      };

      const result = loader(config);

      expect(result).toContain("width=500");
      expect(result).toContain("quality=70");
      expect(result).toContain("format=auto");
    });

    it("should fallback to original URL for unknown domains", () => {
      const loader = createImageLoader();
      const config = {
        quality: 60,
        src: "https://example.com/image.jpg",
        width: 200,
      };

      const result = loader(config);

      expect(result).toBe(config.src);
    });

    it("should use default quality when not specified", () => {
      const loader = createImageLoader({ defaultQuality: 85 });
      const config = {
        src: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        width: 800,
      };

      const result = loader(config);

      expect(result).toContain("q_85");
    });

    it("should handle custom loaders", () => {
      const loader = createImageLoader({
        customLoaders: [customLoader],
      });

      const config = {
        quality: 75,
        src: "https://custom.com/image.jpg",
        width: 400,
      };

      const result = loader(config);

      expect(result).toBe("https://custom.com/image.jpg?w=400&q=75");
    });

    it("should handle errors in loaders gracefully", () => {
      const loader = createImageLoader({
        customLoaders: [faultyLoader],
      });

      const config = {
        quality: 60,
        src: "https://example.com/image.jpg",
        width: 200,
      };

      const result = loader(config);

      expect(result).toBe(config.src);
    });
  });

  describe("defaultImageLoader", () => {
    it("should be a function", () => {
      expect(typeof defaultImageLoader).toBe("function");
    });

    it("should work with Cloudinary URLs", () => {
      const config = {
        quality: 75,
        src: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        width: 800,
      };

      const result = defaultImageLoader(config);

      expect(result).toContain("w_800");
      expect(result).toContain("q_75");
    });
  });
});
