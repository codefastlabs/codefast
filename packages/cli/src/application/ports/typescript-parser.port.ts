import type { ExportInfo } from "../../domain/shared/types";

export interface TypeScriptParserPort {
  parseContent: (content: string, filePath: string) => Promise<ParsedFile>;
  parseFile: (filePath: string) => Promise<ParsedFile>;
}

export interface ParsedFile {
  exports: ExportInfo[];
  filePath: string;
  hasReactImport: boolean;
  isTypeScriptReact: boolean;
}
