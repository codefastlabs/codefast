import { describe, expect, it } from "@jest/globals";

import {
  baseJavaScriptRules,
  typescriptRules,
  nodeEnvironment,
  browserEnvironment,
  testEnvironment,
  jsonRules,
  markdownRules,
  reactRules,
  nextRules,
  onlyWarnRules,
  prettierRules,
  tsdocRules,
  turboRules,
  basePreset,
  libraryPreset,
  reactAppPreset,
  nextAppPreset,
  composeConfig,
} from "./index";

describe("ESLint Config Package Exports", () => {
  describe("Core Rules", () => {
    it("should export baseJavaScriptRules as an array", () => {
      expect(Array.isArray(baseJavaScriptRules)).toBe(true);
      expect(baseJavaScriptRules.length).toBeGreaterThan(0);
    });

    it("should export typescriptRules as an array", () => {
      expect(Array.isArray(typescriptRules)).toBe(true);
      expect(typescriptRules.length).toBeGreaterThan(0);
    });
  });

  describe("Environment Rules", () => {
    it("should export nodeEnvironment as an array", () => {
      expect(Array.isArray(nodeEnvironment)).toBe(true);
      expect(nodeEnvironment.length).toBeGreaterThan(0);
    });

    it("should export browserEnvironment as an array", () => {
      expect(Array.isArray(browserEnvironment)).toBe(true);
      expect(browserEnvironment.length).toBeGreaterThan(0);
    });

    it("should export testEnvironment as an array", () => {
      expect(Array.isArray(testEnvironment)).toBe(true);
      expect(testEnvironment.length).toBeGreaterThan(0);
    });
  });

  describe("Language Rules", () => {
    it("should export jsonRules as an array", () => {
      expect(Array.isArray(jsonRules)).toBe(true);
      expect(jsonRules.length).toBeGreaterThan(0);
    });

    it("should export markdownRules as an array", () => {
      expect(Array.isArray(markdownRules)).toBe(true);
      expect(markdownRules.length).toBeGreaterThan(0);
    });
  });

  describe("Framework Rules", () => {
    it("should export reactRules as an array", () => {
      expect(Array.isArray(reactRules)).toBe(true);
      expect(reactRules.length).toBeGreaterThan(0);
    });

    it("should export nextRules as an array", () => {
      expect(Array.isArray(nextRules)).toBe(true);
      expect(nextRules.length).toBeGreaterThan(0);
    });
  });

  describe("Utility Rules", () => {
    it("should export onlyWarnRules as an array", () => {
      expect(Array.isArray(onlyWarnRules)).toBe(true);
      expect(onlyWarnRules.length).toBeGreaterThan(0);
    });

    it("should export prettierRules as an array", () => {
      expect(Array.isArray(prettierRules)).toBe(true);
      expect(prettierRules.length).toBeGreaterThan(0);
    });

    it("should export tsdocRules as an array", () => {
      expect(Array.isArray(tsdocRules)).toBe(true);
      expect(tsdocRules.length).toBeGreaterThan(0);
    });

    it("should export turboRules as an array", () => {
      expect(Array.isArray(turboRules)).toBe(true);
      expect(turboRules.length).toBeGreaterThan(0);
    });
  });

  describe("Presets", () => {
    it("should export basePreset as an array", () => {
      expect(Array.isArray(basePreset)).toBe(true);
      expect(basePreset.length).toBeGreaterThan(0);
    });

    it("should export libraryPreset as an array", () => {
      expect(Array.isArray(libraryPreset)).toBe(true);
      expect(libraryPreset.length).toBeGreaterThan(0);
    });

    it("should export reactAppPreset as an array", () => {
      expect(Array.isArray(reactAppPreset)).toBe(true);
      expect(reactAppPreset.length).toBeGreaterThan(0);
    });

    it("should export nextAppPreset as an array", () => {
      expect(Array.isArray(nextAppPreset)).toBe(true);
      expect(nextAppPreset.length).toBeGreaterThan(0);
    });
  });

  describe("Utilities", () => {
    it("should export composeConfig as a function", () => {
      expect(typeof composeConfig).toBe("function");
    });
  });

  describe("Configuration Structure", () => {
    it("should have valid ESLint configuration objects", () => {
      const configs = [
        baseJavaScriptRules,
        typescriptRules,
        nodeEnvironment,
        browserEnvironment,
        testEnvironment,
        jsonRules,
        markdownRules,
        reactRules,
        nextRules,
        onlyWarnRules,
        prettierRules,
        tsdocRules,
        turboRules,
      ];

      for (const config of configs) {
        expect(Array.isArray(config)).toBe(true);
        for (const configItem of config) {
          expect(typeof configItem).toBe("object");
          expect(configItem).not.toBeNull();
        }
      }
    });

    it("should have valid preset configurations", () => {
      const presets = [basePreset, libraryPreset, reactAppPreset, nextAppPreset];

      for (const preset of presets) {
        expect(Array.isArray(preset)).toBe(true);
        expect(preset.length).toBeGreaterThan(0);
        for (const configItem of preset) {
          expect(typeof configItem).toBe("object");
          expect(configItem).not.toBeNull();
        }
      }
    });
  });
});
