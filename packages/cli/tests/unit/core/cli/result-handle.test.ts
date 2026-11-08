import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { consumeCliAppError, reportAppError } from "#core/cli/result-handle";
import { AppError } from "#core/errors";
import { logger } from "#core/logger";
import { err, ok } from "#core/result";

let previousExitCode: typeof process.exitCode;

beforeEach(() => {
  previousExitCode = process.exitCode;
  process.exitCode = undefined;
});

afterEach(() => {
  process.exitCode = previousExitCode;
  vi.restoreAllMocks();
});

describe("consumeCliAppError", () => {
  it("records exit 2 for every error code", () => {
    vi.spyOn(logger, "err").mockImplementation(() => {});

    for (const code of ["NOT_FOUND", "VALIDATION_ERROR", "INFRA_FAILURE"] as const) {
      process.exitCode = undefined;
      expect(consumeCliAppError(err(new AppError(code, "broken")))).toBe(false);
      expect(process.exitCode).toBe(2);
    }
  });

  it("passes a success through and prints its message", () => {
    const outSpy = vi.spyOn(logger, "out").mockImplementation(() => {});

    expect(consumeCliAppError(ok(1), { successMessage: "done" })).toBe(true);
    expect(outSpy).toHaveBeenCalledWith("done");
    expect(process.exitCode).toBeUndefined();
  });
});

describe("reportAppError", () => {
  const failure = new AppError("INFRA_FAILURE", "disk gone", new Error("EIO"));

  it("prints the cause's stack only when verbose", () => {
    const errSpy = vi.spyOn(logger, "err").mockImplementation(() => {});

    reportAppError(failure, false);
    expect(errSpy).toHaveBeenCalledTimes(1);

    errSpy.mockClear();
    reportAppError(failure, true);
    expect(errSpy).toHaveBeenCalledTimes(2);
    expect(String(errSpy.mock.calls[1]?.[0])).toContain("Error: EIO");
  });
});
