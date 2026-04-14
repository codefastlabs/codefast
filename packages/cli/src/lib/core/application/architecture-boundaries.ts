import fs from "node:fs";
import path from "node:path";

const BOUNDED_CONTEXTS = new Set(["arrange", "mirror", "tag"]);
const LAYERS = new Set(["domain", "application", "infra", "presentation"]);

export type LibSourceLocation = {
  readonly context: string;
  readonly layer: string;
};

/**
 * Extract `#lib/...` and relative import specifiers from TypeScript source (static `from` / `import("...")` only).
 */
export function extractImportSpecifiers(sourceText: string): string[] {
  const specifiers: string[] = [];
  const fromPattern = /\bfrom\s+["']([^"']+)["']/g;
  let fromMatch: RegExpExecArray | null;
  while ((fromMatch = fromPattern.exec(sourceText)) !== null) {
    specifiers.push(fromMatch[1]);
  }
  const importOnlyPattern = /^\s*import\s+["']([^"']+)["']\s*;/gm;
  let importOnlyMatch: RegExpExecArray | null;
  while ((importOnlyMatch = importOnlyPattern.exec(sourceText)) !== null) {
    specifiers.push(importOnlyMatch[1]);
  }
  const importCallPattern = /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g;
  let importCallMatch: RegExpExecArray | null;
  while ((importCallMatch = importCallPattern.exec(sourceText)) !== null) {
    specifiers.push(importCallMatch[1]);
  }
  return specifiers;
}

function pathUnderCliSrcLib(absolutePath: string): string | null {
  const normalized = path.normalize(absolutePath);
  const marker = `${path.sep}src${path.sep}lib${path.sep}`;
  const index = normalized.lastIndexOf(marker);
  if (index === -1) {
    return null;
  }
  return normalized.slice(index + marker.length);
}

export function parseLibSourceLocation(absoluteFilePath: string): LibSourceLocation | null {
  const tail = pathUnderCliSrcLib(absoluteFilePath);
  if (tail === null) {
    return null;
  }
  const parts = tail.split(path.sep).filter(Boolean);
  if (parts.length < 2) {
    return null;
  }
  const [context, layer, ...rest] = parts;
  if (!LAYERS.has(layer)) {
    return null;
  }
  if (layer === "domain" && rest[0] === "__tests__") {
    return { context, layer };
  }
  return { context, layer };
}

export function isArchitectureExcludedSourceFile(absoluteFilePath: string): boolean {
  const base = path.basename(absoluteFilePath);
  if (base.endsWith(".test.ts") || base.endsWith(".integration.test.ts")) {
    return true;
  }
  return absoluteFilePath.split(path.sep).includes("__tests__");
}

function resolveRelativeSpecifier(fromAbsoluteFile: string, specifier: string): string | null {
  if (!specifier.startsWith(".")) {
    return null;
  }
  const dir = path.dirname(fromAbsoluteFile);
  const resolved = path.normalize(path.join(dir, specifier));
  return resolved;
}

function libTailAfterResolution(absoluteResolved: string): string[] | null {
  const tail = pathUnderCliSrcLib(absoluteResolved);
  if (tail === null) {
    return null;
  }
  return tail.split(path.sep).filter(Boolean);
}

function violationDomainLayer(
  loc: LibSourceLocation,
  specifier: string,
  fromAbsoluteFile: string,
): string | null {
  if (specifier.startsWith("#lib/")) {
    const segments = specifier.slice("#lib/".length).split("/").filter(Boolean);
    if (segments.length === 0) {
      return null;
    }
    if (segments[0] === "infra") {
      return `${fromAbsoluteFile}: domain must not import ${specifier}`;
    }
    if (segments[0] === loc.context && segments.length >= 2) {
      const importLayer = segments[1];
      if (
        importLayer === "application" ||
        importLayer === "infra" ||
        importLayer === "presentation"
      ) {
        return `${fromAbsoluteFile}: domain must not import ${specifier}`;
      }
    }
    if (
      segments.length >= 2 &&
      segments[1] === "domain" &&
      BOUNDED_CONTEXTS.has(segments[0]) &&
      segments[0] !== loc.context
    ) {
      return `${fromAbsoluteFile}: domain (${loc.context}) must not import other bounded context domain ${specifier}`;
    }
    if (
      loc.context === "core" &&
      segments.length >= 2 &&
      segments[1] === "domain" &&
      BOUNDED_CONTEXTS.has(segments[0])
    ) {
      return `${fromAbsoluteFile}: core/domain must not import bounded context domain ${specifier}`;
    }
    if (
      loc.context === "config" &&
      segments.length >= 2 &&
      segments[1] === "domain" &&
      BOUNDED_CONTEXTS.has(segments[0])
    ) {
      return `${fromAbsoluteFile}: config/domain must not import bounded context domain ${specifier}`;
    }
    return null;
  }

  const resolved = resolveRelativeSpecifier(fromAbsoluteFile, specifier);
  if (resolved === null) {
    return null;
  }
  const parts = libTailAfterResolution(resolved);
  if (parts === null || parts.length < 2) {
    return null;
  }
  const [relCtx, relLayer] = parts;
  if (relCtx === "infra") {
    return `${fromAbsoluteFile}: domain must not resolve into infra via ${specifier}`;
  }
  if (relCtx === loc.context) {
    if (relLayer === "application" || relLayer === "infra" || relLayer === "presentation") {
      return `${fromAbsoluteFile}: domain must not resolve into ${relLayer} via ${specifier}`;
    }
  }
  if (relLayer === "domain" && BOUNDED_CONTEXTS.has(relCtx) && relCtx !== loc.context) {
    return `${fromAbsoluteFile}: domain must not resolve into other bounded context domain via ${specifier}`;
  }
  if (loc.context === "core" && relLayer === "domain" && BOUNDED_CONTEXTS.has(relCtx)) {
    return `${fromAbsoluteFile}: core/domain must not resolve into bounded context domain via ${specifier}`;
  }
  return null;
}

function violationApplicationLayer(
  loc: LibSourceLocation,
  specifier: string,
  fromAbsoluteFile: string,
): string | null {
  void loc;
  if (specifier.startsWith("#lib/")) {
    const segments = specifier.slice("#lib/".length).split("/").filter(Boolean);
    if (segments.length === 0) {
      return null;
    }
    if (segments[0] === "infra") {
      return `${fromAbsoluteFile}: application must not import ${specifier}`;
    }
    if (segments.length >= 2 && (segments[1] === "infra" || segments[1] === "presentation")) {
      return `${fromAbsoluteFile}: application must not import ${specifier}`;
    }
    return null;
  }
  const resolved = resolveRelativeSpecifier(fromAbsoluteFile, specifier);
  if (resolved === null) {
    return null;
  }
  const parts = libTailAfterResolution(resolved);
  if (parts === null || parts.length < 2) {
    return null;
  }
  const [relCtx, relLayer] = parts;
  if (relCtx === "infra") {
    return `${fromAbsoluteFile}: application must not resolve into infra via ${specifier}`;
  }
  if (relLayer === "infra" || relLayer === "presentation") {
    return `${fromAbsoluteFile}: application must not resolve into ${relLayer} via ${specifier}`;
  }
  return null;
}

/**
 * Returns human-readable violations for a single file's imports (for unit tests and tooling).
 */
export function violationsForFileContent(
  absoluteFilePath: string,
  loc: LibSourceLocation,
  sourceText: string,
): string[] {
  const violations: string[] = [];
  for (const specifier of extractImportSpecifiers(sourceText)) {
    if (loc.layer === "domain") {
      const domainViolation = violationDomainLayer(loc, specifier, absoluteFilePath);
      if (domainViolation !== null) {
        violations.push(domainViolation);
      }
    } else if (loc.layer === "application") {
      const appViolation = violationApplicationLayer(loc, specifier, absoluteFilePath);
      if (appViolation !== null) {
        violations.push(appViolation);
      }
    }
  }
  return violations;
}

function walkNonTestTsFiles(rootDir: string): string[] {
  const results: string[] = [];
  const scan = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === "dist") {
          continue;
        }
        scan(full);
      } else if (entry.isFile() && entry.name.endsWith(".ts")) {
        if (!isArchitectureExcludedSourceFile(full)) {
          results.push(full);
        }
      }
    }
  };
  scan(rootDir);
  return results;
}

/**
 * Scans `packages/cli/src/lib` for explicit-architecture boundary violations (non-test sources only).
 */
export function scanCliPackageArchitectureViolations(cliPackageRoot: string): string[] {
  const libRoot = path.join(cliPackageRoot, "src", "lib");
  const violations: string[] = [];
  for (const absoluteFilePath of walkNonTestTsFiles(libRoot)) {
    const loc = parseLibSourceLocation(absoluteFilePath);
    if (loc === null || (loc.layer !== "domain" && loc.layer !== "application")) {
      continue;
    }
    const sourceText = fs.readFileSync(absoluteFilePath, "utf8");
    violations.push(...violationsForFileContent(absoluteFilePath, loc, sourceText));
  }
  return violations;
}
