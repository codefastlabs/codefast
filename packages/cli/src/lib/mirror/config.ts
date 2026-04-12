import path from "node:path";
import { pathToFileURL } from "node:url";
import type { CliFs } from "#lib/infra/fs-contract";
import {
  CODEFAST_CONFIG_JS,
  CODEFAST_CONFIG_JSON,
  LEGACY_CONFIG_JS,
  LEGACY_CONFIG_JSON,
} from "#lib/mirror/constants";
import type { MirrorConfig } from "#lib/mirror/types";

function configImportUrl(filePath: string): string {
  return pathToFileURL(filePath).href;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isPathTransformations(
  value: unknown,
): value is NonNullable<MirrorConfig["pathTransformations"]> {
  if (!isPlainObject(value)) return false;
  for (const inner of Object.values(value)) {
    if (!isPlainObject(inner)) return false;
    if (
      "removePrefix" in inner &&
      inner.removePrefix !== undefined &&
      typeof inner.removePrefix !== "string"
    ) {
      return false;
    }
  }
  return true;
}

function isCustomExports(value: unknown): value is NonNullable<MirrorConfig["customExports"]> {
  if (!isPlainObject(value)) return false;
  for (const inner of Object.values(value)) {
    if (!isPlainObject(inner)) return false;
    for (const leaf of Object.values(inner)) {
      if (typeof leaf !== "string") return false;
    }
  }
  return true;
}

function isCssExports(value: unknown): value is NonNullable<MirrorConfig["cssExports"]> {
  if (!isPlainObject(value)) return false;
  for (const entry of Object.values(value)) {
    if (typeof entry === "boolean") continue;
    if (!isPlainObject(entry)) return false;
    if ("enabled" in entry && entry.enabled !== undefined && typeof entry.enabled !== "boolean") {
      return false;
    }
    if (
      "forceExportFiles" in entry &&
      entry.forceExportFiles !== undefined &&
      typeof entry.forceExportFiles !== "boolean"
    ) {
      return false;
    }
    const nested = entry.customExports;
    if (nested !== undefined) {
      if (!isPlainObject(nested)) return false;
      for (const leaf of Object.values(nested)) {
        if (typeof leaf !== "string") return false;
      }
    }
  }
  return true;
}

/** Copies only {@link MirrorConfig} keys with runtime shape checks; strips unknown keys. */
function extractMirrorConfig(parsedObj: Record<string, unknown>): MirrorConfig {
  const config: MirrorConfig = {};

  const skipPackages = parsedObj.skipPackages;
  if (skipPackages !== undefined && isStringArray(skipPackages)) {
    config.skipPackages = skipPackages;
  }

  const pathTransformations = parsedObj.pathTransformations;
  if (pathTransformations !== undefined && isPathTransformations(pathTransformations)) {
    config.pathTransformations = pathTransformations;
  }

  const customExports = parsedObj.customExports;
  if (customExports !== undefined && isCustomExports(customExports)) {
    config.customExports = customExports;
  }

  const cssExports = parsedObj.cssExports;
  if (cssExports !== undefined && isCssExports(cssExports)) {
    config.cssExports = cssExports;
  }

  return config;
}

function normalizeLoadedConfig(raw: unknown): MirrorConfig {
  if (!isPlainObject(raw)) return {};
  const parsedObj = raw;
  if ("mirror" in parsedObj) {
    const wrapped = parsedObj.mirror;
    if (isPlainObject(wrapped)) {
      return extractMirrorConfig(wrapped);
    }
  }
  return extractMirrorConfig(parsedObj);
}

export async function loadMirrorConfig(
  rootDir: string,
  fs: CliFs,
): Promise<{ config: MirrorConfig; warnings: string[] }> {
  const warnings: string[] = [];

  for (const name of CODEFAST_CONFIG_JS) {
    const filePath = path.join(rootDir, name);
    if (!fs.existsSync(filePath)) continue;
    try {
      const mod = await import(configImportUrl(filePath));
      return { config: normalizeLoadedConfig(mod.default ?? mod), warnings };
    } catch {
      warnings.push(`Could not load ${name}. Trying other config files…`);
    }
  }

  const codefastJson = path.join(rootDir, CODEFAST_CONFIG_JSON);
  if (fs.existsSync(codefastJson)) {
    try {
      const content = await fs.readFile(codefastJson, "utf8");
      return { config: normalizeLoadedConfig(JSON.parse(content)), warnings };
    } catch (error) {
      warnings.push(`Could not parse ${CODEFAST_CONFIG_JSON}: ${String(error)}`);
    }
  }

  const legacyJs = path.join(rootDir, LEGACY_CONFIG_JS);
  if (fs.existsSync(legacyJs)) {
    try {
      const mod = await import(configImportUrl(legacyJs));
      return { config: normalizeLoadedConfig(mod.default ?? mod), warnings };
    } catch {
      warnings.push(`Could not load ${LEGACY_CONFIG_JS}. Falling back to .json`);
    }
  }

  const legacyJson = path.join(rootDir, LEGACY_CONFIG_JSON);
  if (fs.existsSync(legacyJson)) {
    try {
      const content = await fs.readFile(legacyJson, "utf8");
      return { config: normalizeLoadedConfig(JSON.parse(content)), warnings };
    } catch (error) {
      warnings.push(`Could not parse ${LEGACY_CONFIG_JSON}: ${String(error)}`);
    }
  }

  return { config: {}, warnings };
}
