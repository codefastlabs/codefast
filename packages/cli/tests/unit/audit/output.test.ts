import { afterEach, describe, expect, it, vi } from "vitest";

import { presentAuditAll } from "#audit/output";
import { refuseColor } from "#core/style";
import { captureLogger } from "#tests/unit/support/logger-capture";

afterEach(() => {
  refuseColor(false);
  vi.restoreAllMocks();
});

describe("presentAuditAll", () => {
  it("prints each audit under its name and counts only the audits that ran", () => {
    refuseColor(true);
    const printed = captureLogger();
    const present = vi.fn();

    presentAuditAll(
      {
        audits: [
          { name: "links", status: "clean", result: {}, present },
          { name: "rtl", status: "skipped", reason: "no target", present: () => {} },
        ],
      },
      0.5,
    );

    expect(present).toHaveBeenCalledOnce();
    expect(printed.out()).toContain("audit:links");
    expect(printed.out()).toContain("○ skipped: no target");
    expect(printed.out()).toContain("✓ audit: all 1 audits that ran are clean (0.50s)");
  });

  it("names every audit with findings or an error", () => {
    refuseColor(true);
    const printed = captureLogger();

    presentAuditAll(
      {
        audits: [
          { name: "links", status: "findings", result: {}, present: () => {} },
          { name: "rtl", status: "error", error: { code: "NOT_FOUND", message: "Not found" }, present: () => {} },
          { name: "imports", status: "clean", result: {}, present: () => {} },
        ],
      },
      0.5,
    );

    expect(printed.out()).toContain("✗ audit: 2 of 3 failed — links (findings), rtl (error)");
  });
});
