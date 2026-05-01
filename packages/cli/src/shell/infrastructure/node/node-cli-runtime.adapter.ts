import process from "node:process";
import { injectable } from "@codefast/di";
import type { CliRuntimePort } from "#/shell/application/ports/outbound/cli-runtime.port";

@injectable([])
export class NodeCliRuntimeAdapter implements CliRuntimePort {
  cwd(): string {
    return process.cwd();
  }

  setExitCode(code: number): void {
    process.exitCode = code;
  }

  isStdoutTty(): boolean {
    return !!process.stdout.isTTY;
  }
}
