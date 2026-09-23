import { describe, expect, it } from "vitest";

import { MissingMockFactoryError } from "#errors/errors";
import type { TestBedOptions } from "#test-bed/bed-builder";
import { createTestBed } from "#test-bed/test-bed";
import { EmailServiceToken, OrderProcessor } from "#tests/unit/support/fixtures";

/** `createTestBed` as plain JavaScript reaches it, with options the types never checked. */
function createUntypedTestBed(options: object): unknown {
  return createTestBed(options as TestBedOptions<() => unknown>);
}

describe("createTestBed", () => {
  it("refuses options with no factory rather than standing the built-in spy in for one", () => {
    expect(() => createUntypedTestBed({})).toThrow(MissingMockFactoryError);
    expect(() => createUntypedTestBed({ mockFactory: undefined })).toThrow(MissingMockFactoryError);
    expect(() => createUntypedTestBed({})).toThrow(/defaultMockFactory/);
  });

  it("reads its options once, so a later write cannot change the beds it begins", () => {
    const calls: Array<string> = [];
    const options = { mockFactory: () => (): unknown => calls.push("first") };
    const FirstTestBed = createTestBed(options);
    options.mockFactory = () => (): unknown => calls.push("second");

    FirstTestBed.solitary(OrderProcessor).compile().mocks.get(EmailServiceToken).send("to", "body");

    expect(calls).toStrictEqual(["first"]);
  });
});
