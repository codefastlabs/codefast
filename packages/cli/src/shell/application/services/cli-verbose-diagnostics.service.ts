import { injectable } from "@codefast/di";
import type { CliVerboseDiagnosticsPort } from "#/shell/application/outbound/cli-verbose-diagnostics.outbound-port";

@injectable()
export class CliVerboseDiagnosticsService implements CliVerboseDiagnosticsPort {
  isVerboseCliDiagnostics(): boolean {
    const raw = process.env.CODEFAST_VERBOSE;
    return raw === "1" || raw === "true";
  }
}
