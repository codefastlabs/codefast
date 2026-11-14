import { describe, expect, it } from "vitest";

import { applyAllowlist, fileScan, findingsIn } from "#audit/domain/findings";

describe("findingsIn", () => {
  it("places each detection in its file", () => {
    expect(findingsIn("a.ts", [{ line: 2, raw: "ml-2", reason: "use ms-2" }])).toEqual([
      { file: "a.ts", line: 2, text: "ml-2", message: "use ms-2" },
    ]);
  });
});

describe("applyAllowlist", () => {
  const scan = fileScan(
    [
      { file: "b.ts", line: 9, text: "text-left", message: "use text-start" },
      { file: "a.ts", line: 3, text: "ml-2", message: "use ms-2" },
      { file: "a.ts", line: 1, text: "pr-4", message: "use pe-4" },
      { file: "c.ts", line: 1, text: "ml-2", message: "use ms-2" },
    ],
    3,
  );

  it("drops a finding its bare text or its file:text names, counts them, and sorts the rest by place", () => {
    const report = applyAllowlist(scan, ["text-left", "c.ts:ml-2"]);

    expect(report.allowlisted).toBe(2);
    expect(report.findings.map(({ file, line }) => `${file}:${line}`)).toEqual(["a.ts:1", "a.ts:3"]);
    expect(report.scannedFiles).toBe(3);
  });

  it("keeps whatever else the scan carries", () => {
    expect(applyAllowlist({ ...scan, floors: ["24.15.0"] }, []).floors).toEqual(["24.15.0"]);
  });
});
