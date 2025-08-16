import type { ImageLoaderProps } from "next/image";

import { BaseImageLoader } from "@/base-loader";

// Concrete test implementation of BaseImageLoader for testing
class TestImageLoader extends BaseImageLoader {
  public getName(): string {
    return "test";
  }

  public canHandle(source: string): boolean {
    return source.includes("test.com");
  }

  // Expose protected methods for testing
  public testBuildQueryParams(params: Record<string, number | string | undefined>): string {
    return this.buildQueryParams(params);
  }

  public testEnsureProtocol(url: string, defaultProtocol?: string): string {
    return this.ensureProtocol(url, defaultProtocol);
  }

  public testExtractDomain(url: string): string {
    return this.extractDomain(url);
  }

  public testValidateConfig(config: ImageLoaderProps): void {
    this.validateConfig(config);
  }

  public testNormalizeConfig(config: ImageLoaderProps): ImageLoaderProps {
    return this.normalizeConfig(config);
  }

  protected transformUrl(config: ImageLoaderProps): string {
    return config.src;
  }
}

describe("BaseImageLoader", () => {
  const loader = new TestImageLoader();
  const loaderWithCustomQuality = new TestImageLoader({ defaultQuality: 90 });

  describe("constructor", () => {
    it("should use default quality of 75 when no config provided", () => {
      const result = loader.testNormalizeConfig({
        src: "https://test.com/image.jpg",
        width: 800,
      });

      expect(result.quality).toBe(75);
    });

    it("should use custom default quality when provided in config", () => {
      const result = loaderWithCustomQuality.testNormalizeConfig({
        src: "https://test.com/image.jpg",
        width: 800,
      });

      expect(result.quality).toBe(90);
    });
  });

  describe("buildQueryParams", () => {
    it("should build query string from parameters", () => {
      const result = loader.testBuildQueryParams({
        format: "auto",
        quality: 80,
        width: 800,
      });

      expect(result).toBe("?format=auto&quality=80&width=800");
    });

    it("should handle undefined parameters", () => {
      const result = loader.testBuildQueryParams({
        format: "auto",
        quality: undefined,
        width: 800,
      });

      expect(result).toBe("?format=auto&width=800");
    });

    it("should return empty string when no parameters", () => {
      const result = loader.testBuildQueryParams({});

      expect(result).toBe("");
    });

    it("should return empty string when all parameters are undefined", () => {
      const result = loader.testBuildQueryParams({
        quality: undefined,
        width: undefined,
      });

      expect(result).toBe("");
    });
  });

  describe("ensureProtocol", () => {
    it("should add https protocol to URLs starting with //", () => {
      const result = loader.testEnsureProtocol("//example.com/image.jpg");

      expect(result).toBe("https://example.com/image.jpg");
    });

    it("should add custom protocol to URLs starting with //", () => {
      const result = loader.testEnsureProtocol("//example.com/image.jpg", "http");

      expect(result).toBe("http://example.com/image.jpg");
    });

    it("should add https protocol to URLs without protocol", () => {
      const result = loader.testEnsureProtocol("example.com/image.jpg");

      expect(result).toBe("https://example.com/image.jpg");
    });

    it("should add custom protocol to URLs without protocol", () => {
      const result = loader.testEnsureProtocol("example.com/image.jpg", "http");

      expect(result).toBe("http://example.com/image.jpg");
    });

    it("should not modify URLs that already have http protocol", () => {
      const url = "http://example.com/image.jpg";
      const result = loader.testEnsureProtocol(url);

      expect(result).toBe(url);
    });

    it("should not modify URLs that already have https protocol", () => {
      const url = "https://example.com/image.jpg";
      const result = loader.testEnsureProtocol(url);

      expect(result).toBe(url);
    });
  });

  describe("extractDomain", () => {
    it("should extract domain from valid URL", () => {
      const result = loader.testExtractDomain("https://example.com/path/image.jpg");

      expect(result).toBe("example.com");
    });

    it("should extract domain and convert to lowercase", () => {
      const result = loader.testExtractDomain("https://EXAMPLE.COM/path/image.jpg");

      expect(result).toBe("example.com");
    });

    it("should return empty string for invalid URL", () => {
      const result = loader.testExtractDomain("not-a-valid-url");

      expect(result).toBe("");
    });
  });

  describe("validateConfig", () => {
    it("should pass validation for valid config", () => {
      expect(() => {
        loader.testValidateConfig({
          quality: 80,
          src: "https://test.com/image.jpg",
          width: 800,
        });
      }).not.toThrow();
    });

    it("should throw error for empty src", () => {
      expect(() => {
        loader.testValidateConfig({
          src: "",
          width: 800,
        });
      }).toThrow("Image source URL is required");
    });

    it("should throw error for zero width", () => {
      expect(() => {
        loader.testValidateConfig({
          src: "https://test.com/image.jpg",
          width: 0,
        });
      }).toThrow("Image width must be a positive number");
    });

    it("should throw error for negative width", () => {
      expect(() => {
        loader.testValidateConfig({
          src: "https://test.com/image.jpg",
          width: -100,
        });
      }).toThrow("Image width must be a positive number");
    });

    it("should throw error for quality below 1", () => {
      expect(() => {
        loader.testValidateConfig({
          quality: 0,
          src: "https://test.com/image.jpg",
          width: 800,
        });
      }).toThrow("Image quality must be between 1 and 100");
    });

    it("should throw error for quality above 100", () => {
      expect(() => {
        loader.testValidateConfig({
          quality: 101,
          src: "https://test.com/image.jpg",
          width: 800,
        });
      }).toThrow("Image quality must be between 1 and 100");
    });
  });

  describe("normalizeConfig", () => {
    it("should apply default quality when not specified", () => {
      const result = loader.testNormalizeConfig({
        src: "https://test.com/image.jpg",
        width: 800,
      });

      expect(result.quality).toBe(75);
    });

    it("should preserve specified quality", () => {
      const result = loader.testNormalizeConfig({
        quality: 90,
        src: "https://test.com/image.jpg",
        width: 800,
      });

      expect(result.quality).toBe(90);
    });

    it("should preserve other config properties", () => {
      const config = {
        quality: 85,
        src: "https://test.com/image.jpg",
        width: 800,
      };
      const result = loader.testNormalizeConfig(config);

      expect(result.src).toBe(config.src);
      expect(result.width).toBe(config.width);
      expect(result.quality).toBe(config.quality);
    });
  });

  describe("load", () => {
    it("should call validation, normalization, and transformation", () => {
      const result = loader.load({
        quality: 80,
        src: "https://test.com/image.jpg",
        width: 800,
      });

      expect(result).toBe("https://test.com/image.jpg");
    });
  });
});
