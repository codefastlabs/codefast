export type TagFileResult = {
  filePath: string;
  taggedDeclarations: number;
  changed: boolean;
};

export type TagRunResult = {
  version: string;
  filesScanned: number;
  filesChanged: number;
  taggedDeclarations: number;
  fileResults: TagFileResult[];
};

export type TagRunOptions = {
  write: boolean;
};
