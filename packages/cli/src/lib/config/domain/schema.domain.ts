export type CodefastAfterWriteHook = (ctx: { files: string[] }) => void | Promise<void>;

export type MirrorPathTransformation = {
  removePrefix?: string;
};

export type MirrorCssExportRule =
  | boolean
  | {
      enabled?: boolean;
      customExports?: Record<string, string>;
      forceExportFiles?: boolean;
    };

export type MirrorConfig = {
  skipPackages?: string[];
  pathTransformations?: Record<string, MirrorPathTransformation>;
  customExports?: Record<string, Record<string, string>>;
  cssExports?: Record<string, MirrorCssExportRule>;
};

export type CodefastTagConfig = {
  skipPackages?: string[];
  onAfterWrite?: CodefastAfterWriteHook;
};

export type CodefastArrangeConfig = {
  onAfterWrite?: CodefastAfterWriteHook;
};

export type CodefastConfig = {
  mirror?: MirrorConfig;
  tag?: CodefastTagConfig;
  arrange?: CodefastArrangeConfig;
};
