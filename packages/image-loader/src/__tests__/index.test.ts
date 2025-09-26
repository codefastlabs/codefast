import type { ImageLoaderProps } from "next/image";

import { imageLoader } from "..";

describe("Image Loader", () => {
  describe("Cloudinary URLs", () => {
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

    it("should handle invalid Cloudinary URLs", () => {
      const config: ImageLoaderProps = {
        quality: 75,
        src: "https://res.cloudinary.com/demo/invalid/path/sample.jpg",
        width: 800,
      };

      const result = imageLoader(config);

      expect(result).toBe(config.src);
    });
  });

  describe("Imgix URLs", () => {
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
  });

  describe("Unsplash URLs", () => {
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
  });

  describe("AWS CloudFront URLs", () => {
    it("should transform CloudFront URLs correctly", () => {
      const config: ImageLoaderProps = {
        quality: 90,
        src: "https://d1234567890.cloudfront.net/image.jpg",
        width: 300,
      };

      const result = imageLoader(config);

      expect(result).toContain("w=300");
      expect(result).toContain("q=90");
      expect(result).toContain("f=auto");
    });
  });

  describe("Supabase URLs", () => {
    it("should transform Supabase URLs correctly", () => {
      const config: ImageLoaderProps = {
        quality: 70,
        src: "https://xyz.supabase.co/storage/v1/object/public/bucket/image.jpg",
        width: 500,
      };

      const result = imageLoader(config);

      expect(result).toContain("width=500");
      expect(result).toContain("quality=70");
      expect(result).toContain("format=auto");
    });
  });

  describe("Contentful URLs", () => {
    it("should transform Contentful URLs correctly", () => {
      const config: ImageLoaderProps = {
        quality: 80,
        src: "https://images.ctfassets.net/space/image.jpg",
        width: 400,
      };

      const result = imageLoader(config);

      expect(result).toContain("w=400");
      expect(result).toContain("q=80");
      expect(result).toContain("fm=webp");
    });
  });

  describe("ImageKit URLs", () => {
    it("should transform ImageKit URLs correctly", () => {
      const config: ImageLoaderProps = {
        quality: 80,
        src: "https://ik.imagekit.io/id/image.jpg",
        width: 400,
      };

      const result = imageLoader(config);

      expect(result).toContain("tr=w-400%2Cq-80"); // URL encoded comma
    });
  });

  describe("Sanity URLs", () => {
    it("should transform Sanity URLs correctly", () => {
      const config: ImageLoaderProps = {
        quality: 80,
        src: "https://cdn.sanity.io/images/project/dataset/image.jpg",
        width: 400,
      };

      const result = imageLoader(config);

      expect(result).toContain("w=400");
      expect(result).toContain("q=80");
      expect(result).toContain("auto=format");
      expect(result).toContain("fit=max");
    });
  });

  describe("Fallback behavior", () => {
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
  });

  describe("Error handling", () => {
    it("should handle malformed URLs gracefully", () => {
      const config: ImageLoaderProps = {
        quality: 75,
        src: "not-a-valid-url",
        width: 800,
      };

      const result = imageLoader(config);

      expect(result).toBe(config.src);
    });

    it("should handle empty src", () => {
      const config: ImageLoaderProps = {
        quality: 75,
        src: "",
        width: 800,
      };

      const result = imageLoader(config);

      expect(result).toBe("");
    });
  });
});
