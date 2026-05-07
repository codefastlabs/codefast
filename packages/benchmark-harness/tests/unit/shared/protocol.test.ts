import { describe, expect, it } from "vitest";

import {
  BENCH_RESULT_JSON_END,
  BENCH_RESULT_JSON_START,
  extractSubprocessPayload,
} from "#/shared/protocol";

describe("extractSubprocessPayload", () => {
  it("extracts framed payload from noisy stdout", () => {
    const payloadJson =
      '{"fingerprint":{"nodeVersion":"v22.0.0","v8Version":"12.0","platform":"darwin","arch":"arm64","cpuModel":"apple","cpuCount":8,"nodeOptions":"","libraryName":"x","libraryVersion":"1.0.0","gcExposed":false,"timestampIso":"2026-01-01T00:00:00.000Z"},"trials":[],"sanityFailures":[]}';

    const stdout = [
      "deprecation warning",
      BENCH_RESULT_JSON_START,
      payloadJson,
      BENCH_RESULT_JSON_END,
      "extra output",
    ].join("\n");

    expect(extractSubprocessPayload(stdout)).toEqual({
      fingerprint: {
        nodeVersion: "v22.0.0",
        v8Version: "12.0",
        platform: "darwin",
        arch: "arm64",
        cpuModel: "apple",
        cpuCount: 8,
        nodeOptions: "",
        libraryName: "x",
        libraryVersion: "1.0.0",
        gcExposed: false,
        timestampIso: "2026-01-01T00:00:00.000Z",
      },
      trials: [],
      sanityFailures: [],
    });
  });

  it("returns undefined when framing markers are missing", () => {
    expect(
      extractSubprocessPayload('{"fingerprint":{},"trials":[],"sanityFailures":[]}'),
    ).toBeUndefined();
  });
});
