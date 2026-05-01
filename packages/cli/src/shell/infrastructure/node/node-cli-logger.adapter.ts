import process from "node:process";
import { injectable } from "@codefast/di";
import type { CliLogger } from "#/shell/application/outbound/cli-io.outbound-port";

@injectable([])
export class NodeCliLoggerAdapter implements CliLogger {
  out(line: string): void {
    process.stdout.write(`${line}\n`);
  }
  err(line: string): void {
    process.stderr.write(`${line}\n`);
  }
}
