import path from "node:path";

import type { FilesystemPort } from "#/core/filesystem/port";
import { DIST_DIR } from "#/mirror/domain/constants";
import type { PackageJsonShape } from "#/mirror/domain/types";
import { writePackageJsonExportsAtomic } from "#/mirror/write-exports";

const DTS_EXTENSIONS = [".d.mts", ".d.ts", ".d.cts"] as const;
const JS_EXTENSIONS = [".mjs", ".js"] as const;

/**
 * Infer the dist module path (e.g. `"index"`, `"components/button"`) from an existing
 * conditional export entry. Prefers `import` / `require` values because their extensions
 * are simpler than `.d.mts` etc.
 */
function inferModulePath(specifier: string, entry: Record<string, unknown>): string {
  for (const key of ["import", "require"] as const) {
    const value = entry[key];
    if (typeof value === "string" && value.startsWith("./dist/")) {
      const relative = value.slice("./dist/".length);
      for (const ext of JS_EXTENSIONS) {
        if (relative.endsWith(ext)) {
          return relative.slice(0, -ext.length);
        }
      }
    }
  }

  const typesValue = entry.types;
  if (typeof typesValue === "string" && typesValue.startsWith("./dist/")) {
    const relative = typesValue.slice("./dist/".length);
    for (const ext of DTS_EXTENSIONS) {
      if (relative.endsWith(ext)) {
        return relative.slice(0, -ext.length);
      }
    }
  }

  if (specifier === ".") {
    return "index";
  }
  if (specifier.startsWith("./")) {
    return specifier.slice(2);
  }
  return specifier;
}

function findDtsSpecifier(fs: FilesystemPort, distDir: string, modulePath: string): string | null {
  for (const ext of DTS_EXTENSIONS) {
    if (fs.existsSync(path.join(distDir, `${modulePath}${ext}`))) {
      return `./dist/${modulePath}${ext}`;
    }
  }
  return null;
}

function findImportSpecifier(fs: FilesystemPort, distDir: string, modulePath: string): string | null {
  for (const ext of JS_EXTENSIONS) {
    if (fs.existsSync(path.join(distDir, `${modulePath}${ext}`))) {
      return `./dist/${modulePath}${ext}`;
    }
  }
  return null;
}

/**
 * Rebuild an export entry in canonical key order, adding any missing conditions.
 * Key order: source → types → import → require → (remaining original keys).
 */
function buildSupplementedEntry(
  specifier: string,
  existing: Record<string, unknown>,
  modulePath: string,
  distDir: string,
  fs: FilesystemPort,
  options: {
    source: boolean | string;
    types: boolean;
    import: boolean;
    resolveSourcePath: (modulePath: string) => string;
  },
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const knownKeys = new Set(["source", "types", "import", "require"]);

  // source — always handle first to keep it at position 0
  if ("source" in existing) {
    result.source = existing.source;
  } else if (options.source) {
    if (typeof options.source === "string" && specifier === ".") {
      result.source = options.source;
    } else {
      result.source = options.resolveSourcePath(modulePath);
    }
  }

  // types — preserve existing or supplement from dist/
  if ("types" in existing) {
    result.types = existing.types;
  } else if (options.types) {
    const found = findDtsSpecifier(fs, distDir, modulePath);
    if (found) {
      result.types = found;
    }
  }

  // import — preserve existing or supplement from dist/
  if ("import" in existing) {
    result.import = existing.import;
  } else if (options.import) {
    const found = findImportSpecifier(fs, distDir, modulePath);
    if (found) {
      result.import = found;
    }
  }

  // require — preserve existing
  if ("require" in existing) {
    result.require = existing.require;
  }

  // any other non-standard conditions (e.g. "default", "browser", custom)
  for (const [key, value] of Object.entries(existing)) {
    if (!knownKeys.has(key) && !(key in result)) {
      result[key] = value;
    }
  }

  return result;
}

/**
 * @since 0.3.16-canary.3
 */
export type SupplementResult = {
  supplementedSpecifiers: Array<string>;
};

/**
 * @since 0.3.16-canary.0
 */
export async function supplementExportsInPackageJson(
  fs: FilesystemPort,
  packageJsonPath: string,
  packageDir: string,
  options: {
    source: boolean | string;
    types: boolean;
    import: boolean;
    resolveSourcePath: (modulePath: string) => string;
  },
  write = true,
): Promise<SupplementResult> {
  const raw = await fs.readFile(packageJsonPath, "utf8");
  const packageJson = JSON.parse(raw) as PackageJsonShape;

  const existingExports = packageJson.exports;
  if (!existingExports || typeof existingExports !== "object" || Array.isArray(existingExports)) {
    return { supplementedSpecifiers: [] };
  }

  const distDir = path.join(packageDir, DIST_DIR);
  const supplementedSpecifiers: Array<string> = [];
  const supplementedExports: Record<string, unknown> = {};
  const originalPathBySpecifier: Record<string, string> = {};

  for (const [specifier, entry] of Object.entries(existingExports as Record<string, unknown>)) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      supplementedExports[specifier] = entry;
      originalPathBySpecifier[specifier] = specifier;
      continue;
    }

    const entryRecord = entry as Record<string, unknown>;
    const modulePath = inferModulePath(specifier, entryRecord);
    const supplemented = buildSupplementedEntry(specifier, entryRecord, modulePath, distDir, fs, options);

    const wasChanged = JSON.stringify(supplemented) !== JSON.stringify(entryRecord);
    if (wasChanged) {
      supplementedSpecifiers.push(specifier);
    }

    supplementedExports[specifier] = supplemented;
    originalPathBySpecifier[specifier] = specifier;
  }

  await writePackageJsonExportsAtomic(
    fs,
    packageJsonPath,
    {
      generatedExports: supplementedExports as Parameters<typeof writePackageJsonExportsAtomic>[2]["generatedExports"],
      managedExportSpecifiers: Object.keys(supplementedExports),
      originalPathBySpecifier,
    },
    write,
  );

  return { supplementedSpecifiers };
}

/**
 * Build a `resolveSourcePath` closure that checks the filesystem for `.tsx` before
 * falling back to `.ts`. Mirrors the logic used in normal (non-custom) mode.
 *
 * @since 0.3.16-canary.0
 */
export function buildSourcePathResolver(fs: FilesystemPort, packageDir: string): (modulePath: string) => string {
  const srcDir = path.join(packageDir, "src");
  return (modulePath) => {
    const tsxPath = path.join(srcDir, `${modulePath}.tsx`);
    return fs.existsSync(tsxPath) ? `./src/${modulePath}.tsx` : `./src/${modulePath}.ts`;
  };
}
