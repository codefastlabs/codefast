import process from "node:process";
import { injectable } from "@codefast/di";
import type { CliRuntime } from "#/shell/application/outbound/cli-runtime.outbound-port";

@injectable([])
export class NodeCliRuntimeAdapter implements CliRuntime {
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
