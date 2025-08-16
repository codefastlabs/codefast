import { CloudinaryLoader } from "@/loaders/cloudinary-loader";

describe("CloudinaryLoader", () => {
  const loader = new CloudinaryLoader();

  describe("getName", () => {
    it("should return the correct loader name", () => {
      expect(loader.getName()).toBe("cloudinary");
    });
  });

  describe("canHandle", () => {
    it("should handle *.cloudinary.com URLs", () => {
      expect(loader.canHandle("https://res.cloudinary.com/demo/image/upload/sample.jpg")).toBe(
        true,
      );
      expect(loader.canHandle("https://my-cloud.cloudinary.com/image/upload/sample.jpg")).toBe(
        true,
      );
    });

    it("should not handle other domains", () => {
      expect(loader.canHandle("https://example.com/image.jpg")).toBe(false);
      expect(loader.canHandle("https://images.unsplash.com/photo-123")).toBe(false);
    });

    it("should not handle URLs without protocol", () => {
      expect(loader.canHandle("res.cloudinary.com/demo/image/upload/sample.jpg")).toBe(false);
    });
  });

  describe("load", () => {
    it("should transform Cloudinary URLs with width and quality", () => {
      const result = loader.load({
        quality: 80,
        src: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        width: 800,
      });

      expect(result).toContain("w_800");
      expect(result).toContain("q_80");
      expect(result).toContain("f_auto");
      expect(result).toContain("c_fill");
    });

    it("should use default quality when not specified", () => {
      const result = loader.load({
        src: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        width: 800,
      });

      expect(result).toContain("w_800");
      expect(result).toContain("q_75"); // default quality
      expect(result).toContain("f_auto");
      expect(result).toContain("c_fill");
    });

    it("should handle URLs with existing transformations", () => {
      const result = loader.load({
        quality: 90,
        src: "https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg",
        width: 600,
      });

      expect(result).toContain("w_600");
      expect(result).toContain("q_90");
      expect(result).toContain("v1234567890");
    });

    it("should return original URL for invalid Cloudinary structure", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => {
        // Intentionally empty to suppress console output during tests
      });
      const invalidUrl = "https://res.cloudinary.com/demo/invalid/sample.jpg";
      const result = loader.load({
        src: invalidUrl,
        width: 800,
      });

      expect(result).toBe(invalidUrl);
      expect(consoleSpy).toHaveBeenCalledWith(`Invalid Cloudinary URL structure: ${invalidUrl}`);
      consoleSpy.mockRestore();
    });

    it("should return original URL for malformed URLs", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => {
        // Intentionally empty to suppress console output during tests
      });
      const malformedUrl = "not-a-valid-url";
      const result = loader.load({
        src: malformedUrl,
        width: 800,
      });

      expect(result).toBe(malformedUrl);
      expect(consoleSpy).toHaveBeenCalledWith(
        `Failed to transform Cloudinary URL: ${malformedUrl}`,
        expect.objectContaining({
          message: "Invalid URL",
          name: "TypeError",
        }),
      );
      consoleSpy.mockRestore();
    });

    it("should throw error for invalid width", () => {
      expect(() => {
        loader.load({
          src: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
          width: 0,
        });
      }).toThrow("Image width must be a positive number");
    });

    it("should throw error for invalid quality", () => {
      expect(() => {
        loader.load({
          quality: 101,
          src: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
          width: 800,
        });
      }).toThrow("Image quality must be between 1 and 100");
    });

    it("should throw error for empty src", () => {
      expect(() => {
        loader.load({
          src: "",
          width: 800,
        });
      }).toThrow("Image source URL is required");
    });
  });
});
