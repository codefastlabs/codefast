import type { MirrorConfig } from "#lib/mirror/types";

export type CodefastAfterWriteHook = (ctx: { files: string[] }) => void | Promise<void>;

export interface CodefastTagConfig {
  onAfterWrite?: CodefastAfterWriteHook;
}

export interface CodefastArrangeConfig {
  onAfterWrite?: CodefastAfterWriteHook;
}

export interface CodefastConfig {
  mirror?: MirrorConfig;
  tag?: CodefastTagConfig;
  arrange?: CodefastArrangeConfig;
}
