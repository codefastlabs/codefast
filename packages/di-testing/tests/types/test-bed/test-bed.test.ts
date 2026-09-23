import { defaultMetadataReader } from "@codefast/di";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import type { Mock } from "vitest";

import { MissingMockFactoryError } from "#errors/errors";
import { defaultMockFactory } from "#mocking/mock-factory";
import type { Spy } from "#mocking/spy";
import type { SociableTestBedBuilder } from "#test-bed/sociable-builder";
import type { SolitaryTestBedBuilder } from "#test-bed/solitary-builder";
import { createTestBed, TestBed } from "#test-bed/test-bed";
import type { TestBedStatic } from "#test-bed/test-bed";
import { EmailServiceToken, OrderProcessor } from "#tests/unit/support/fixtures";

/** A backend of its own, so a bed typed against it can be told apart from one built with the default spy. */
interface CountingStub {
  (...args: ReadonlyArray<unknown>): unknown;
  readonly calls: Array<ReadonlyArray<unknown>>;
}

function countingStub(): CountingStub {
  const calls: Array<ReadonlyArray<unknown>> = [];
  return Object.assign(
    (...args: ReadonlyArray<unknown>): unknown => {
      calls.push(args);
      return undefined;
    },
    { calls },
  );
}

describe("a test-bed entry point fixes one backend for every bed it begins", () => {
  it("builds the default entry point's mocks with the built-in spy", () => {
    expectTypeOf(TestBed).toEqualTypeOf<TestBedStatic<Spy>>();
    expectTypeOf(TestBed.solitary(OrderProcessor)).toEqualTypeOf<SolitaryTestBedBuilder<OrderProcessor, Spy>>();
    expectTypeOf(TestBed.sociable(OrderProcessor)).toEqualTypeOf<
      Pick<SociableTestBedBuilder<OrderProcessor, Spy>, "expose">
    >();

    const send = TestBed.solitary(OrderProcessor).compile().mocks.get(EmailServiceToken).send;
    send("to", "body");
    expect(send.mock.calls).toStrictEqual([["to", "body"]]);
  });

  it("infers the backend from the factory an entry point is created with, and builds every mock with it", () => {
    const CountingTestBed = createTestBed({ mockFactory: countingStub, metadataReader: defaultMetadataReader });

    expectTypeOf(CountingTestBed).toEqualTypeOf<TestBedStatic<CountingStub>>();
    expectTypeOf(CountingTestBed.sociable(OrderProcessor)).toEqualTypeOf<
      Pick<SociableTestBedBuilder<OrderProcessor, CountingStub>, "expose">
    >();
    expectTypeOf(createTestBed({ mockFactory: () => vi.fn() })).toEqualTypeOf<TestBedStatic<Mock>>();
    expectTypeOf(createTestBed({ mockFactory: defaultMockFactory })).toEqualTypeOf<TestBedStatic<Spy>>();

    const send = CountingTestBed.solitary(OrderProcessor).compile().mocks.get(EmailServiceToken).send;
    send("to", "body");
    expect(send.calls).toStrictEqual([["to", "body"]]);
  });

  it("leaves no way to name a backend a bed is not built with", () => {
    // @ts-expect-error an entry point is created with the factory its backend comes from
    expect(() => createTestBed({ metadataReader: defaultMetadataReader })).toThrow(MissingMockFactoryError);
    // @ts-expect-error a named backend must match the factory that builds it
    createTestBed<CountingStub>({ mockFactory: defaultMockFactory });
    // @ts-expect-error a bed takes its backend from its entry point, never from a type argument
    TestBed.solitary<OrderProcessor, CountingStub>(OrderProcessor);
    // @ts-expect-error nor from options passed per bed
    TestBed.solitary(OrderProcessor, { mockFactory: countingStub });
  });
});
