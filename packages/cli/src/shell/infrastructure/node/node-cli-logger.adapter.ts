import process from "node:process";
import { injectable } from "@codefast/di";
import type { CliLoggerPort } from "#/shell/application/ports/outbound/cli-logger.port";

@injectable([])
export class NodeCliLoggerAdapter implements CliLoggerPort {
  out(line: string): void {
    process.stdout.write(`${line}\n`);
  }
  err(line: string): void {
    process.stderr.write(`${line}\n`);
  }
}
