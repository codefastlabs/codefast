import process from "node:process";
import { injectable } from "@codefast/di";
import type { CliLogger } from "#/shell/application/ports/outbound/cli-io.port";

@injectable([])
export class NodeCliLoggerAdapter implements CliLogger {
  out(line: string): void {
    process.stdout.write(`${line}\n`);
  }
  err(line: string): void {
    process.stderr.write(`${line}\n`);
  }
}
