import type { CliLogger } from "#lib/infra/fs-contract";
import { isPackageSkipped, resolvePackageScopedConfig } from "#lib/mirror/config-resolver";
import type { MirrorPackageMeta } from "#lib/mirror/types";

function createLoggerProbe(): { logger: CliLogger; lines: string[] } {
  const lines: string[] = [];
  return {
    logger: {
      out: (line: string) => {
        lines.push(line);
      },
      err: () => {},
    },
    lines,
  };
}

function expectedWarning(pkgMeta: MirrorPackageMeta, configKeyName: string): string {
  return `[Deprecation Warning] Path-based configuration key "${pkgMeta.relPath}" for "${configKeyName}" is deprecated and will be removed in the future. Please migrate to using the package name "${pkgMeta.packageName}".`;
}

describe("config-resolver", () => {
  const pkgMeta: MirrorPackageMeta = {
    relPath: "packages/ui",
    packageName: "@acme/ui",
  };

  describe("resolvePackageScopedConfig", () => {
    it("returns packageName value and does not log", () => {
      const { logger, lines } = createLoggerProbe();
      const configMap = {
        "@acme/ui": { removePrefix: "./components/" },
        "packages/ui": { removePrefix: "./legacy-components/" },
      };

      const resolved = resolvePackageScopedConfig(
        configMap,
        pkgMeta,
        "pathTransformations",
        logger,
      );
      expect(resolved).toEqual({ removePrefix: "./components/" });
      expect(lines).toEqual([]);
    });

    it("falls back to relPath and logs deprecation warning", () => {
      const { logger, lines } = createLoggerProbe();
      const configMap = {
        "packages/ui": { removePrefix: "./legacy-components/" },
      };

      const resolved = resolvePackageScopedConfig(
        configMap,
        pkgMeta,
        "pathTransformations",
        logger,
      );
      expect(resolved).toEqual({ removePrefix: "./legacy-components/" });
      expect(lines).toEqual([expectedWarning(pkgMeta, "pathTransformations")]);
    });

    it("returns undefined when no key matches", () => {
      const { logger, lines } = createLoggerProbe();
      const configMap = {
        "@acme/other": { removePrefix: "./components/" },
      };

      const resolved = resolvePackageScopedConfig(
        configMap,
        pkgMeta,
        "pathTransformations",
        logger,
      );
      expect(resolved).toBeUndefined();
      expect(lines).toEqual([]);
    });
  });

  describe("isPackageSkipped", () => {
    it("returns true when packageName is listed and does not log", () => {
      const { logger, lines } = createLoggerProbe();
      const skipped = isPackageSkipped(["@acme/ui"], pkgMeta, logger);
      expect(skipped).toBe(true);
      expect(lines).toEqual([]);
    });

    it("falls back to relPath and logs deprecation warning", () => {
      const { logger, lines } = createLoggerProbe();
      const skipped = isPackageSkipped(["packages/ui"], pkgMeta, logger);
      expect(skipped).toBe(true);
      expect(lines).toEqual([expectedWarning(pkgMeta, "skipPackages")]);
    });

    it("prefers packageName when both keys are present", () => {
      const { logger, lines } = createLoggerProbe();
      const skipped = isPackageSkipped(["@acme/ui", "packages/ui"], pkgMeta, logger);
      expect(skipped).toBe(true);
      expect(lines).toEqual([]);
    });

    it("returns false when no key matches", () => {
      const { logger, lines } = createLoggerProbe();
      const skipped = isPackageSkipped(["@acme/other"], pkgMeta, logger);
      expect(skipped).toBe(false);
      expect(lines).toEqual([]);
    });
  });
});
