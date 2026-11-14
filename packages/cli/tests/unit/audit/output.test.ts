import { afterEach, describe, expect, it, vi } from "vitest";

import { presentAuditAll } from "#audit/output";
import { AppError } from "#core/errors";
import { logger } from "#core/logger";

afterEach(() => {
  vi.restoreAllMocks();
});

function capture(): { out: () => string; err: () => string } {
  const outSpy = vi.spyOn(logger, "out").mockImplementation(() => {});
  const errSpy = vi.spyOn(logger, "err").mockImplementation(() => {});
  const join = (calls: Array<Array<unknown>>): string => calls.map((call) => String(call[0])).join("\n");
  return { out: () => join(outSpy.mock.calls), err: () => join(errSpy.mock.calls) };
}

describe("presentAuditAll", () => {
  it("prints each audit under its name and counts only the audits that ran", () => {
    const printed = capture();
    const present = vi.fn();

    presentAuditAll(
      [
        { name: "links", status: "clean", result: {}, present },
        { name: "rtl", status: "skipped", reason: "no target" },
      ],
      false,
    );

    expect(present).toHaveBeenCalledOnce();
    expect(printed.out()).toContain("audit:links");
    expect(printed.out()).toContain("Skipped: no target");
    expect(printed.out()).toContain("All 1 audits that ran are clean");
  });

  it("names every audit with findings or an error, and reports the error on stderr", () => {
    const printed = capture();

    presentAuditAll(
      [
        { name: "links", status: "findings", result: {}, present: () => {} },
        { name: "rtl", status: "error", error: new AppError("NOT_FOUND", "Not found: /repo/src") },
        { name: "imports", status: "clean", result: {}, present: () => {} },
      ],
      false,
    );

    expect(printed.err()).toBe("[NOT_FOUND] Not found: /repo/src");
    expect(printed.out()).toContain("2 of 3 audits failed: links (findings), rtl (error)");
  });
});
