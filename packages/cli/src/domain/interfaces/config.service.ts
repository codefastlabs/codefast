import type { ConfigGroups } from "@/domain/entities/config-file";
import type { ScriptConfig } from "@/domain/entities/package-config";

/**
 * Interface for accessing CLI configuration, including config groups for a create-project
 * and script configuration for update-exports.
 */
export interface ConfigServiceInterface {
  getConfigGroups: () => ConfigGroups;
  getScriptConfig: () => ScriptConfig;
}
