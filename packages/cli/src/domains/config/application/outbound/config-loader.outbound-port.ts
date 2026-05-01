import type { CodefastConfig } from "#/domains/config/domain/schema.domain";

export type LoadConfigPayload = {
  config: CodefastConfig;
  warnings: string[];
  configPath?: string;
};

export interface ConfigLoaderPort {
  loadConfig(startDir: string): Promise<LoadConfigPayload>;
}
