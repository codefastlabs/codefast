import type { CliFs } from "#lib/core/application/ports/cli-io.port";

export interface FileWalkerPort {
  walkTypeScriptFiles(rootDirectoryPath: string, fs: CliFs): string[];
}
