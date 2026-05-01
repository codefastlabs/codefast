import path from "node:path";
import { injectable } from "@codefast/di";
import type { CliPathPort } from "#/shell/application/ports/outbound/cli-path.port";

@injectable([])
export class NodeCliPathAdapter implements CliPathPort {
  resolve(...paths: string[]): string {
    return path.resolve(...paths);
  }

  join(...paths: string[]): string {
    return path.join(...paths);
  }

  relative(from: string, to: string): string {
    return path.relative(from, to);
  }

  dirname(pathValue: string): string {
    return path.dirname(pathValue);
  }

  basename(pathValue: string): string {
    return path.basename(pathValue);
  }

  extname(pathValue: string): string {
    return path.extname(pathValue);
  }

  get separator(): string {
    return path.sep;
  }
}
