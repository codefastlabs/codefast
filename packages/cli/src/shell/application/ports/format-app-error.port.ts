import type { AppError } from "#/shell/domain/errors.domain";

export interface FormatAppErrorPort {
  format(error: AppError): string;
}
