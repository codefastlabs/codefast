import { describe, expect, it } from "vitest";
import { CLI_EXIT_GENERAL_ERROR, CLI_EXIT_USAGE } from "#/lib/core/domain/cli-exit-codes.domain";
import { AppError } from "#/lib/core/domain/errors.domain";
import { exitCodeForAppError } from "#/lib/core/presentation/cli-executor.presenter";

describe("exitCodeForAppError", () => {
  it("maps NOT_FOUND and INFRA_FAILURE to general error", () => {
    expect(exitCodeForAppError(new AppError("NOT_FOUND", "x"))).toBe(CLI_EXIT_GENERAL_ERROR);
    expect(exitCodeForAppError(new AppError("INFRA_FAILURE", "x"))).toBe(CLI_EXIT_GENERAL_ERROR);
  });

  it("maps VALIDATION_ERROR to usage (invalid invocation / input)", () => {
    expect(exitCodeForAppError(new AppError("VALIDATION_ERROR", "bad"))).toBe(CLI_EXIT_USAGE);
  });
});
