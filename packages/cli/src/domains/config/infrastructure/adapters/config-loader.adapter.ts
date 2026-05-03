import path from "node:path";
import jiti from "jiti";
import type { ZodError } from "zod";
import { inject, injectable } from "@codefast/di";
import type { CodefastConfigSchemaPort } from "#/domains/config/application/ports/outbound/codefast-config-schema.port";
import type {
  ConfigLoaderPort,
  LoadConfigPayload,
} from "#/domains/config/application/ports/outbound/config-loader.port";
import type { CodefastConfig } from "#/domains/config/domain/schema.domain";
import { CodefastConfigSchemaPortToken } from "#/domains/config/composition/tokens";
import type { FilesystemPort } from "#/shell/application/ports/outbound/cli-fs.port";
import { CliFilesystemPortToken } from "#/shell/application/cli-runtime.tokens";

@injectable([inject(CliFilesystemPortToken), inject(CodefastConfigSchemaPortToken)])
export class ConfigLoaderAdapter implements ConfigLoaderPort {
  private readonly configJsPriority = [
    "codefast.config.mjs",
    "codefast.config.js",
    "codefast.config.cjs",
  ] as const;
  private readonly configJson = "codefast.config.json";

  private readonly cachedLoads = new Map<string, Promise<LoadConfigPayload>>();

  constructor(
    private readonly fs: FilesystemPort,
    private readonly configSchema: CodefastConfigSchemaPort,
  ) {}

  async loadConfig(startDir: string): Promise<LoadConfigPayload> {
    const cacheKey = path.resolve(startDir);
    if (!this.cachedLoads.has(cacheKey)) {
      this.cachedLoads.set(cacheKey, this.loadOnce(cacheKey));
    }
    const cached = this.cachedLoads.get(cacheKey);
    if (cached === undefined) {
      throw new Error("config loader cache invariant violated");
    }
    return cached;
  }

  private formatZodError(error: ZodError, filePath: string): string {
    const formatted = error.issues
      .map((issue) => {
        const pathLabel = issue.path.length > 0 ? issue.path.join(".") : "<root>";
        return `  - ${pathLabel}: ${issue.message}`;
      })
      .join("\n");

    return `Invalid config schema in ${path.basename(filePath)}:\n${formatted}`;
  }

  private parseLoadedConfig(raw: unknown, filePath: string): CodefastConfig {
    const outcome = this.configSchema.safeParseLoadedConfig(raw);
    if (outcome.kind === "invalid_schema") {
      throw new Error(this.formatZodError(outcome.zodError, filePath));
    }
    return outcome.config;
  }

  private listConfigCandidates(startDir: string): string[] {
    const candidates: string[] = [];
    let current = path.resolve(startDir);
    while (true) {
      for (const name of this.configJsPriority) {
        const candidate = path.join(current, name);
        if (this.fs.existsSync(candidate)) {
          candidates.push(candidate);
        }
      }

      const jsonCandidate = path.join(current, this.configJson);
      if (this.fs.existsSync(jsonCandidate)) {
        candidates.push(jsonCandidate);
      }

      const parent = path.dirname(current);
      if (parent === current) {
        break;
      }
      current = parent;
    }
    return candidates;
  }

  private async readConfigFromPath(filePath: string, jitiBaseDir: string): Promise<CodefastConfig> {
    const ext = path.extname(filePath);
    if (ext === ".json") {
      const content = await this.fs.readFile(filePath, "utf8");
      return this.parseLoadedConfig(JSON.parse(content), filePath);
    }

    const loadWithJiti = jiti(jitiBaseDir, {
      interopDefault: true,
      moduleCache: false,
    });
    const moduleConfig = loadWithJiti(filePath);
    const unwrappedConfig =
      typeof moduleConfig === "object" && moduleConfig !== null && "default" in moduleConfig
        ? (moduleConfig as { default: unknown }).default
        : moduleConfig;
    return this.parseLoadedConfig(unwrappedConfig, filePath);
  }

  private async loadOnce(startDir: string): Promise<LoadConfigPayload> {
    const warnings: string[] = [];
    const configPaths = this.listConfigCandidates(startDir);
    if (configPaths.length === 0) {
      return { config: {}, warnings };
    }

    const configPath = configPaths[0];
    if (configPath === undefined) {
      return { config: {}, warnings };
    }
    const config = await this.readConfigFromPath(configPath, startDir);
    return { config, warnings, configPath };
  }
}
