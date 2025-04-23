import type { ConfigGroups } from "@/domain/entities/config-file";

/**
 * Port for file system operations, including reading, writing, and directory creation.
 */
export interface FileSystemPort {
  access: (filePath: string) => void;
  createConfigFiles: (projectDir: string, configGroups: ConfigGroups) => void;
  createDirectory: (dirPath: string) => void;
  exists: (filePath: string) => boolean;
  readFile: (filePath: string) => string;
  writeConfigFile: (filePath: string, content: string) => void;
  writeFile: (filePath: string, content: string) => void;
}
