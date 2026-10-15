import { afterEach, describe, expect, it, vi } from "vitest";

import type { EnginesAuditResult } from "#audit/domain/types";
import { presentEnginesAuditResult } from "#audit/engines/output";
import { logger } from "#core/logger";

function captureOut(run: () => void): string {
  const spy = vi.spyOn(logger, "out").mockImplementation(() => {});
  run();
  return spy.mock.calls.map((call) => String(call[0])).join("\n");
}

describe("presentEnginesAuditResult", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("prints every kind of violation and a failing total", () => {
    const result: EnginesAuditResult = {
      floors: [],
      violations: [
        { kind: "missing-floor", packageName: "@x/a" },
        { kind: "unparsable-floor", packageName: "@x/b", range: "^24.0.0" },
        {
          kind: "outside-dependency-engines",
          packageName: "@x/c",
          floor: "22.0.0",
          dependency: "vitest",
          field: "devDependencies",
          range: "^22.12.0 || >=24.0.0",
        },
        { kind: "types-off-floor", packageName: "@x/d", floor: "22.12.0", typesVersion: "22.13.0" },
      ],
      packageCount: 4,
    };

    const out = captureOut(() => {
      presentEnginesAuditResult(result);
    });

    expect(out).toContain("@x/a: declares no engines.node");
    expect(out).toContain('@x/b: engines.node "^24.0.0" → write the floor as ">=X.Y.Z"');
    expect(out).toContain(
      `@x/c: floor 22.0.0 is outside vitest's engines.node "^22.12.0 || >=24.0.0" (devDependencies)`,
    );
    expect(out).toContain("@x/d: @types/node resolves to 22.13.0, off floor 22.12.0's line");
    expect(out).toContain("✖ 4 Node floor violation(s) across 4 package(s)");
  });

  it("prints a clean summary counting the packages on each floor", () => {
    const out = captureOut(() => {
      presentEnginesAuditResult({
        floors: [
          { packageName: "@x/a", directory: "packages/a", floor: "22.12.0" },
          { packageName: "@x/b", directory: "packages/b", floor: "22.12.0" },
          { packageName: "@x/c", directory: "packages/c", floor: "24.0.0" },
        ],
        violations: [],
        packageCount: 3,
      });
    });

    expect(out).toBe("✓ Every Node floor holds across 3 package(s): 22.12.0 (2), 24.0.0 (1)");
  });

  it("says so when no package declares a floor", () => {
    const out = captureOut(() => {
      presentEnginesAuditResult({ floors: [], violations: [], packageCount: 1 });
    });

    expect(out).toBe("✓ Every Node floor holds across 1 package(s): none declared");
  });
});
