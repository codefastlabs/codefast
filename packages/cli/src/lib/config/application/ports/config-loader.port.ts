import type { CliFs } from "#/lib/core/application/ports/cli-io.port";
import type { CodefastConfig } from "#/lib/config/domain/schema.domain";

export type LoadConfigPayload = {
  config: CodefastConfig;
  warnings: string[];
  configPath?: string;
};

export interface ConfigLoaderPort {
  loadConfig(fs: CliFs, startDir: string): Promise<LoadConfigPayload>;
}
