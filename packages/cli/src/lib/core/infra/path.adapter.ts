import path from "node:path";
import type { CliPath } from "#/lib/core/application/ports/path.port";

export const nodeCliPath: CliPath = {
  resolve: (...paths: string[]) => path.resolve(...paths),
  join: (...paths: string[]) => path.join(...paths),
  relative: (from: string, to: string) => path.relative(from, to),
  dirname: (pathValue: string) => path.dirname(pathValue),
  basename: (pathValue: string) => path.basename(pathValue),
  extname: (pathValue: string) => path.extname(pathValue),
  separator: path.sep,
};
