import type { ConfigGroups } from "@/domain/entities/config-file";

/**
 * Interface for accessing CLI configuration, including config groups for a create-project
 * and script configuration for update-exports.
 */
export interface ConfigServiceInterface {
  getConfigGroups: () => ConfigGroups;
}
