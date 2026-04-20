import type { CliFs } from "#/lib/core/application/ports/cli-io.port";
import type { CliPath } from "#/lib/core/application/ports/path.port";

/**
 * Product bounded contexts: no direct cross-imports between these (domain + application rules).
 */
const PRODUCT_BOUNDED_CONTEXTS = new Set(["arrange", "mirror", "tag"]);

const SHARED_SOURCE_CODE_CONTEXT = "shared-source-code";
const PATH_SEPARATOR = "/";

const LAYERS = new Set(["domain", "application", "infra", "presentation"]);

/**
 * Import roots that any product slice may depend on without going "through" another slice.
 */
const NEUTRAL_LIB_IMPORT_ROOTS = new Set(["core", "config", "infra", "shared"]);

/**
 * Internal imports: tsconfig `#/*` → `src/*`.
 */
const INTERNAL_LIB_PREFIX = "#/lib/";

function pathAfterInternalLibPrefix(specifier: string): string | null {
  if (!specifier.startsWith(INTERNAL_LIB_PREFIX)) {
    return null;
  }
  return specifier.slice(INTERNAL_LIB_PREFIX.length);
}

function internalLibSpecifierSegmentList(specifier: string): string[] | null {
  const afterPrefix = pathAfterInternalLibPrefix(specifier);
  if (afterPrefix === null) {
    return null;
  }
  const segments = afterPrefix.split(PATH_SEPARATOR).filter(Boolean);
  return segments.length === 0 ? null : segments;
}

function normalizePathSeparators(pathValue: string): string {
  return pathValue.split("\\").join(PATH_SEPARATOR);
}

function splitPath(pathValue: string): string[] {
  return normalizePathSeparators(pathValue).split(PATH_SEPARATOR).filter(Boolean);
}

function basenamePath(pathValue: string): string {
  const parts = splitPath(pathValue);
  return parts.length === 0 ? "" : (parts[parts.length - 1] ?? "");
}

function dirnamePath(pathValue: string): string {
  const normalized = normalizePathSeparators(pathValue);
  const parts = normalized.split(PATH_SEPARATOR);
  parts.pop();
  if (parts.length === 0) {
    return PATH_SEPARATOR;
  }
  const joined = parts.join(PATH_SEPARATOR);
  return joined === "" ? PATH_SEPARATOR : joined;
}

function joinPath(...segments: string[]): string {
  const joined = segments.map((segment) => normalizePathSeparators(segment)).join(PATH_SEPARATOR);
  return joined.replace(/\/+/g, PATH_SEPARATOR);
}

function normalizeDotSegments(pathValue: string): string {
  const normalized = normalizePathSeparators(pathValue);
  const isAbsolute = normalized.startsWith(PATH_SEPARATOR);
  const segments = normalized.split(PATH_SEPARATOR);
  const stack: string[] = [];
  for (const segment of segments) {
    if (!segment || segment === ".") {
      continue;
    }
    if (segment === "..") {
      if (stack.length > 0) {
        stack.pop();
      }
      continue;
    }
    stack.push(segment);
  }
  const suffix = stack.join(PATH_SEPARATOR);
  return isAbsolute ? `${PATH_SEPARATOR}${suffix}` : suffix;
}

function sharedSourceCodeLayerFromSpecifier(segments: string[]): string | null {
  if (segments.length < 3 || segments[0] !== "shared" || segments[1] !== "source-code") {
    return null;
  }
  const layer = segments[2];
  return layer ?? null;
}

export type LibSourceLocation = {
  readonly context: string;
  readonly layer: string;
};

/**
 * Extract `#/lib/...` and relative import specifiers from TypeScript source
 * (static `from` / `import("...")` only).
 */
export function extractImportSpecifiers(sourceText: string): string[] {
  const specifiers: string[] = [];
  const fromPattern = /\bfrom\s+["']([^"']+)["']/g;
  let fromMatch: RegExpExecArray | null;
  while ((fromMatch = fromPattern.exec(sourceText)) !== null) {
    const cap = fromMatch[1];
    if (cap !== undefined) {
      specifiers.push(cap);
    }
  }
  const importOnlyPattern = /^\s*import\s+["']([^"']+)["']\s*;/gm;
  let importOnlyMatch: RegExpExecArray | null;
  while ((importOnlyMatch = importOnlyPattern.exec(sourceText)) !== null) {
    const cap = importOnlyMatch[1];
    if (cap !== undefined) {
      specifiers.push(cap);
    }
  }
  const importCallPattern = /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g;
  let importCallMatch: RegExpExecArray | null;
  while ((importCallMatch = importCallPattern.exec(sourceText)) !== null) {
    const cap = importCallMatch[1];
    if (cap !== undefined) {
      specifiers.push(cap);
    }
  }
  return specifiers;
}

function pathUnderCliSrcLib(absolutePath: string): string | null {
  const normalized = normalizePathSeparators(absolutePath);
  const marker = `${PATH_SEPARATOR}src${PATH_SEPARATOR}lib${PATH_SEPARATOR}`;
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
  const parts = tail.split(PATH_SEPARATOR).filter(Boolean);
  if (parts.length < 2) {
    return null;
  }

  if (parts[0] === "shared" && parts[1] === "source-code" && parts.length >= 3) {
    const layer = parts[2];
    if (layer === undefined || !LAYERS.has(layer)) {
      return null;
    }
    const rest = parts.slice(3);
    if (layer === "domain" && rest[0] === "__tests__") {
      return { context: SHARED_SOURCE_CODE_CONTEXT, layer: "domain" };
    }
    return { context: SHARED_SOURCE_CODE_CONTEXT, layer };
  }

  const context = parts[0];
  const layer = parts[1];
  const rest = parts.slice(2);
  if (context === undefined || layer === undefined || !LAYERS.has(layer)) {
    return null;
  }
  if (layer === "domain" && rest[0] === "__tests__") {
    return { context, layer };
  }
  return { context, layer };
}

export function isArchitectureExcludedSourceFile(absoluteFilePath: string): boolean {
  const base = basenamePath(absoluteFilePath);
  if (base.endsWith(".test.ts") || base.endsWith(".integration.test.ts")) {
    return true;
  }
  return normalizePathSeparators(absoluteFilePath).split(PATH_SEPARATOR).includes("__tests__");
}

function resolveRelativeSpecifier(fromAbsoluteFile: string, specifier: string): string | null {
  if (!specifier.startsWith(".")) {
    return null;
  }
  const dir = dirnamePath(fromAbsoluteFile);
  const resolved = normalizeDotSegments(joinPath(dir, specifier));
  return resolved;
}

function libTailAfterResolution(absoluteResolved: string): string[] | null {
  const tail = pathUnderCliSrcLib(absoluteResolved);
  if (tail === null) {
    return null;
  }
  return tail.split(PATH_SEPARATOR).filter(Boolean);
}

function lastSegmentOfLibSpecifier(specifier: string): string | null {
  const segments = internalLibSpecifierSegmentList(specifier);
  if (segments === null) {
    return null;
  }
  return segments[segments.length - 1] ?? null;
}

function importedModuleStem(specifier: string, fromAbsoluteFile: string): string | null {
  if (pathAfterInternalLibPrefix(specifier) !== null) {
    return lastSegmentOfLibSpecifier(specifier);
  }
  const resolved = resolveRelativeSpecifier(fromAbsoluteFile, specifier);
  if (resolved === null) {
    return null;
  }
  const withTsExtension = resolved.endsWith(".ts") ? resolved : `${resolved}.ts`;
  const baseName = basenamePath(withTsExtension);
  return baseName.endsWith(".ts") ? baseName.slice(0, -".ts".length) : baseName;
}

function isPureDomainOrModelFileName(fileBaseName: string): boolean {
  return /\.(domain|model)\.ts$/.test(fileBaseName);
}

function isRuleAForbiddenImportedStem(moduleStem: string): boolean {
  return (
    moduleStem.includes(".use-case") ||
    moduleStem.includes(".adapter") ||
    moduleStem.includes(".presenter")
  );
}

function isRuleBForbiddenImportedStem(moduleStem: string): boolean {
  return moduleStem.includes(".adapter") || moduleStem.includes(".presenter");
}

function violationRuleAPureDomainModel(
  absoluteFilePath: string,
  fileBaseName: string,
  specifier: string,
): string | null {
  if (!isPureDomainOrModelFileName(fileBaseName)) {
    return null;
  }
  const stem = importedModuleStem(specifier, absoluteFilePath);
  if (stem === null || !isRuleAForbiddenImportedStem(stem)) {
    return null;
  }
  return `${absoluteFilePath}: Rule A (pure domain/model) must not import orchestration or IO modules — blocked ${specifier} (stem "${stem}")`;
}

function violationRuleBApplicationIsolation(
  loc: LibSourceLocation,
  absoluteFilePath: string,
  specifier: string,
): string | null {
  if (loc.layer !== "application") {
    return null;
  }
  const stem = importedModuleStem(specifier, absoluteFilePath);
  if (stem === null || !isRuleBForbiddenImportedStem(stem)) {
    return null;
  }
  return `${absoluteFilePath}: Rule B (application isolation) must not import adapters or presenters — blocked ${specifier} (stem "${stem}")`;
}

function violationRuleCAntiCrossSlice(
  loc: LibSourceLocation,
  specifier: string,
  fromAbsoluteFile: string,
): string | null {
  if (!PRODUCT_BOUNDED_CONTEXTS.has(loc.context)) {
    return null;
  }
  const ruleCSegments = internalLibSpecifierSegmentList(specifier);
  if (ruleCSegments !== null) {
    const importedRoot = ruleCSegments[0];
    if (importedRoot === undefined || NEUTRAL_LIB_IMPORT_ROOTS.has(importedRoot)) {
      return null;
    }
    if (importedRoot === loc.context) {
      return null;
    }
    if (PRODUCT_BOUNDED_CONTEXTS.has(importedRoot)) {
      return `${fromAbsoluteFile}: Rule C (slice isolation) context "${loc.context}" must not import "${specifier}" — use #/lib/shared/... or neutral roots (core, config, infra) instead`;
    }
    return null;
  }
  const resolved = resolveRelativeSpecifier(fromAbsoluteFile, specifier);
  if (resolved === null) {
    return null;
  }
  const resolvedPath = resolved.endsWith(".ts") ? resolved : `${resolved}.ts`;
  const parts = libTailAfterResolution(resolvedPath);
  if (parts === null || parts.length === 0) {
    return null;
  }
  const importedContext = parts[0];
  if (importedContext === undefined || NEUTRAL_LIB_IMPORT_ROOTS.has(importedContext)) {
    return null;
  }
  if (importedContext === loc.context) {
    return null;
  }
  if (PRODUCT_BOUNDED_CONTEXTS.has(importedContext)) {
    return `${fromAbsoluteFile}: Rule C (slice isolation) context "${loc.context}" must not resolve into sibling slice via ${specifier}`;
  }
  return null;
}

function violationDomainLayer(
  loc: LibSourceLocation,
  specifier: string,
  fromAbsoluteFile: string,
): string | null {
  const domainSegments = internalLibSpecifierSegmentList(specifier);
  if (domainSegments !== null) {
    const segments = domainSegments;
    if (segments[0] === "infra") {
      return `${fromAbsoluteFile}: domain must not import ${specifier}`;
    }
    const sharedLayerImported = sharedSourceCodeLayerFromSpecifier(segments);
    if (sharedLayerImported !== null && sharedLayerImported !== "domain") {
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
    const segmentZero = segments[0];
    if (
      segments.length >= 2 &&
      segments[1] === "domain" &&
      segmentZero !== undefined &&
      PRODUCT_BOUNDED_CONTEXTS.has(segmentZero) &&
      segmentZero !== loc.context
    ) {
      return `${fromAbsoluteFile}: domain (${loc.context}) must not import other bounded context domain ${specifier}`;
    }
    if (
      loc.context === "core" &&
      segments.length >= 2 &&
      segments[1] === "domain" &&
      segmentZero !== undefined &&
      PRODUCT_BOUNDED_CONTEXTS.has(segmentZero)
    ) {
      return `${fromAbsoluteFile}: core/domain must not import bounded context domain ${specifier}`;
    }
    if (
      loc.context === "config" &&
      segments.length >= 2 &&
      segments[1] === "domain" &&
      segmentZero !== undefined &&
      PRODUCT_BOUNDED_CONTEXTS.has(segmentZero)
    ) {
      return `${fromAbsoluteFile}: config/domain must not import bounded context domain ${specifier}`;
    }
    if (
      loc.context === SHARED_SOURCE_CODE_CONTEXT &&
      segmentZero !== undefined &&
      PRODUCT_BOUNDED_CONTEXTS.has(segmentZero)
    ) {
      return `${fromAbsoluteFile}: shared source-code domain must not import product context ${specifier}`;
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
  const relCtx = parts[0];
  const relLayer = parts[1];
  if (relCtx === undefined || relLayer === undefined) {
    return null;
  }
  if (relCtx === "infra") {
    return `${fromAbsoluteFile}: domain must not resolve into infra via ${specifier}`;
  }
  if (relCtx === loc.context) {
    if (relLayer === "application" || relLayer === "infra" || relLayer === "presentation") {
      return `${fromAbsoluteFile}: domain must not resolve into ${relLayer} via ${specifier}`;
    }
  }
  if (relLayer === "domain" && PRODUCT_BOUNDED_CONTEXTS.has(relCtx) && relCtx !== loc.context) {
    return `${fromAbsoluteFile}: domain must not resolve into other bounded context domain via ${specifier}`;
  }
  if (loc.context === "core" && relLayer === "domain" && PRODUCT_BOUNDED_CONTEXTS.has(relCtx)) {
    return `${fromAbsoluteFile}: core/domain must not resolve into bounded context domain via ${specifier}`;
  }
  return null;
}

function violationApplicationLayer(
  loc: LibSourceLocation,
  specifier: string,
  fromAbsoluteFile: string,
): string | null {
  const applicationSegments = internalLibSpecifierSegmentList(specifier);
  if (applicationSegments !== null) {
    const segments = applicationSegments;
    if (segments[0] === "infra") {
      return `${fromAbsoluteFile}: application must not import ${specifier}`;
    }
    const sharedLayerImported = sharedSourceCodeLayerFromSpecifier(segments);
    if (
      sharedLayerImported === "infra" ||
      sharedLayerImported === "presentation" ||
      sharedLayerImported === "application"
    ) {
      return `${fromAbsoluteFile}: application must not import ${specifier}`;
    }
    if (segments.length >= 2 && (segments[1] === "infra" || segments[1] === "presentation")) {
      return `${fromAbsoluteFile}: application must not import ${specifier}`;
    }
    const appSegmentZero = segments[0];
    if (
      PRODUCT_BOUNDED_CONTEXTS.has(loc.context) &&
      appSegmentZero !== undefined &&
      PRODUCT_BOUNDED_CONTEXTS.has(appSegmentZero) &&
      appSegmentZero !== loc.context
    ) {
      return `${fromAbsoluteFile}: application (${loc.context}) must not import ${specifier}`;
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
  const relCtx = parts[0];
  const relLayer = parts[1];
  if (relCtx === undefined || relLayer === undefined) {
    return null;
  }
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
  const fileBaseName = basenamePath(absoluteFilePath);
  for (const specifier of extractImportSpecifiers(sourceText)) {
    const ruleA = violationRuleAPureDomainModel(absoluteFilePath, fileBaseName, specifier);
    if (ruleA !== null) {
      violations.push(ruleA);
    }
    const ruleB = violationRuleBApplicationIsolation(loc, absoluteFilePath, specifier);
    if (ruleB !== null) {
      violations.push(ruleB);
    }
    const ruleC = violationRuleCAntiCrossSlice(loc, specifier, absoluteFilePath);
    if (ruleC !== null) {
      violations.push(ruleC);
    }
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
  return [...new Set(violations)];
}

function walkNonTestTsFiles(rootDir: string, fs: CliFs): string[] {
  const results: string[] = [];
  const scan = (dir: string): void => {
    for (const entryName of fs.readdirSync(dir)) {
      const full = joinPath(dir, entryName);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        if (entryName === "node_modules" || entryName === "dist") {
          continue;
        }
        scan(full);
      } else if (stat.isFile() && entryName.endsWith(".ts")) {
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
export function scanCliPackageArchitectureViolations(
  cliPackageRoot: string,
  fs: CliFs,
  pathService: CliPath,
): string[] {
  const libRoot = pathService.join(cliPackageRoot, "src", "lib");
  const violations: string[] = [];
  for (const absoluteFilePath of walkNonTestTsFiles(libRoot, fs)) {
    const loc = parseLibSourceLocation(absoluteFilePath);
    if (loc === null) {
      continue;
    }
    const sourceText = fs.readFileSync(absoluteFilePath, "utf8");
    violations.push(...violationsForFileContent(absoluteFilePath, loc, sourceText));
  }
  return violations;
}
