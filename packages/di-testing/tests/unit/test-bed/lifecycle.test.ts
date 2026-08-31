import { describe, expect, it } from "vitest";

import type { Mocked } from "#/mocking/auto-mock";
import { TestBed } from "#/test-bed/test-bed";
import type { Logger } from "#/tests/unit/support/fixtures";
import { LifecycleService, LoggerToken } from "#/tests/unit/support/fixtures";

describe("TestBed.solitary lifecycle", () => {
  it("runs @postConstruct during compile", () => {
    const { mocks } = TestBed.solitary(LifecycleService).compile();

    expect(mocks.get(LoggerToken).log.mock.calls.at(0)).toEqual(["start"]);
  });

  it("runs @preDestroy on dispose", async () => {
    const bed = TestBed.solitary(LifecycleService).compile();
    const logger = bed.mocks.get(LoggerToken);

    await bed.dispose();

    expect(logger.log.mock.calls).toContainEqual(["stop"]);
  });

  it("disposes automatically with `await using`", async () => {
    let logger: Mocked<Logger>;
    {
      await using bed = TestBed.solitary(LifecycleService).compile();
      logger = bed.mocks.get(LoggerToken);
    }

    expect(logger.log.mock.calls).toContainEqual(["stop"]);
  });
});
