import { injectable } from "@codefast/di";
import type { AppError } from "#/shell/domain/errors.domain";
import type { FormatAppErrorPort } from "#/shell/application/ports/outbound/format-app-error.port";

@injectable()
export class FormatAppErrorService implements FormatAppErrorPort {
  private assertExhaustiveAppErrorCode(code: never): string {
    return `Unhandled error code: ${String(code)}`;
  }

  format(error: AppError): string {
    const { code, message } = error;
    switch (code) {
      case "NOT_FOUND":
        return `[NOT_FOUND] ${message}`;
      case "VALIDATION_ERROR":
        return `[VALIDATION_ERROR] ${message}`;
      case "INFRA_FAILURE":
        return `[INFRA_FAILURE] ${message}`;
      default:
        return this.assertExhaustiveAppErrorCode(code);
    }
  }
}
