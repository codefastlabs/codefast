import {
  ensureProtocol,
  extractDomain,
  normalizeConfig,
  validateConfig,
} from "../utils";

describe("Utility Functions", () => {
  describe("extractDomain", () => {
    it("should extract domain from valid URLs", () => {
      expect(extractDomain("https://example.com/path")).toBe("example.com");
      expect(extractDomain("http://subdomain.example.com")).toBe("subdomain.example.com");
      expect(extractDomain("https://images.unsplash.com/photo")).toBe("images.unsplash.com");
    });

    it("should return empty string for invalid URLs", () => {
      expect(extractDomain("invalid-url")).toBe("");
      expect(extractDomain("")).toBe("");
    });
  });

  describe("ensureProtocol", () => {
    it("should add https protocol to URLs without protocol", () => {
      expect(ensureProtocol("example.com")).toBe("https://example.com");
      expect(ensureProtocol("images.unsplash.com/photo")).toBe("https://images.unsplash.com/photo");
    });

    it("should handle URLs with // prefix", () => {
      expect(ensureProtocol("//example.com")).toBe("https://example.com");
    });

    it("should not modify URLs with existing protocol", () => {
      expect(ensureProtocol("https://example.com")).toBe("https://example.com");
      expect(ensureProtocol("http://example.com")).toBe("http://example.com");
    });

    it("should use custom default protocol", () => {
      expect(ensureProtocol("example.com", "http")).toBe("http://example.com");
    });
  });

  describe("validateConfig", () => {
    it("should validate correct configuration", () => {
      expect(() => {
        validateConfig({
          quality: 75,
          src: "https://example.com/image.jpg",
          width: 800,
        });
      }).not.toThrow();
    });

    it("should throw error for missing src", () => {
      expect(() => {
        validateConfig({
          quality: 75,
          src: "",
          width: 800,
        });
      }).toThrow("Image source URL is required");
    });

    it("should throw error for invalid width", () => {
      expect(() => {
        validateConfig({
          quality: 75,
          src: "https://example.com/image.jpg",
          width: 0,
        });
      }).toThrow("Image width must be a positive number");
    });

    it("should throw error for invalid quality", () => {
      expect(() => {
        validateConfig({
          quality: 150,
          src: "https://example.com/image.jpg",
          width: 800,
        });
      }).toThrow("Image quality must be between 1 and 100");
    });
  });

  describe("normalizeConfig", () => {
    it("should normalize configuration with defaults", () => {
      const config = {
        quality: 75,
        src: "https://example.com/image.jpg",
        width: 800,
      };

      const result = normalizeConfig(config);

      expect(result).toEqual({
        quality: 75,
        src: "https://example.com/image.jpg",
        width: 800,
      });
    });

    it("should use default width and quality", () => {
      const config = {
        src: "https://example.com/image.jpg",
      };

      const result = normalizeConfig(config, 85);

      expect(result).toEqual({
        quality: 85,
        src: "https://example.com/image.jpg",
        width: 800,
      });
    });

    it("should override with custom default quality", () => {
      const config = {
        src: "https://example.com/image.jpg",
        width: 600,
      };

      const result = normalizeConfig(config, 90);

      expect(result).toEqual({
        quality: 90,
        src: "https://example.com/image.jpg",
        width: 600,
      });
    });
  });
});
