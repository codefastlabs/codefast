import type { CliFs } from "#lib/infra/fs-contract";
import type { MirrorConfig } from "#lib/mirror/types";
import { loadConfig } from "#lib/shared/config-loader";

export async function loadMirrorConfig(
  _rootDir: string,
  fs: CliFs,
): Promise<{ config: MirrorConfig; warnings: string[] }> {
  const { config, warnings } = await loadConfig(fs);
  return { config: config.mirror ?? {}, warnings };
}
