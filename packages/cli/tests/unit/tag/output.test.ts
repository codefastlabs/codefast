import { afterEach, describe, expect, it, vi } from "vitest";

import { logger } from "#core/logger";
import { presentTagResult } from "#tag/output";
import { createTagResult } from "#tests/unit/support/tag-result";

function capture(run: () => void): { readonly out: string; readonly err: string } {
  const outSpy = vi.spyOn(logger, "out").mockImplementation(() => {});
  const errSpy = vi.spyOn(logger, "err").mockImplementation(() => {});
  run();
  const join = (calls: ReadonlyArray<ReadonlyArray<unknown>>): string =>
    calls.map((call) => String(call[0])).join("\n");
  return { out: join(outSpy.mock.calls), err: join(errSpy.mock.calls) };
}

describe("presentTagResult", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("prints each blocked declaration at its root-relative line and counts them in the summary", () => {
    const { out, err } = capture(() => {
      presentTagResult(
        createTagResult({ blockedDeclarations: [{ filePath: "/repo/src/parse.ts", line: 6, name: "parse" }] }),
        "/repo",
      );
    });

    expect(err).toContain("src/parse.ts:6 `parse` left unstamped");
    expect(out).toContain("declarations=0 blocked=1");
  });

  it("keeps the summary free of a blocked count when nothing is blocked", () => {
    const { out, err } = capture(() => {
      presentTagResult(createTagResult(), "/repo");
    });

    expect(err).toBe("");
    expect(out).not.toContain("blocked=");
  });
});
