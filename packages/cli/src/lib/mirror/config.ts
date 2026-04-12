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

function normalizeLoadedConfig(raw: unknown): MirrorConfig {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const o = raw as Record<string, unknown>;
  if ("mirror" in o && o.mirror && typeof o.mirror === "object" && !Array.isArray(o.mirror)) {
    return o.mirror as MirrorConfig;
  }
  return raw as MirrorConfig;
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
