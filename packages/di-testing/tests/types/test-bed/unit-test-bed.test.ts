import { describe, expectTypeOf, it, vi } from "vitest";
import type { Mock } from "vitest";

import type { Mocked } from "#/mocking/auto-mock";
import type { Spy } from "#/mocking/spy";
import { TestBed } from "#/test-bed/test-bed";
import type { EmailService, UserService } from "#/tests/unit/support/fixtures";
import { EmailServiceToken, OrderProcessor, UserServiceToken } from "#/tests/unit/support/fixtures";

describe("UnitReference.get", () => {
  it("types the unit as the class under test", () => {
    const { unit } = TestBed.solitary(OrderProcessor).compile();
    expectTypeOf(unit).toEqualTypeOf<OrderProcessor>();
  });

  it("maps a token to the mocked value type on the default backend", () => {
    const { mocks } = TestBed.solitary(OrderProcessor).compile();

    expectTypeOf(mocks.get(EmailServiceToken)).toEqualTypeOf<Mocked<EmailService>>();
    expectTypeOf(mocks.get(UserServiceToken)).toEqualTypeOf<Mocked<UserService>>();
    expectTypeOf(mocks.get(EmailServiceToken).send).parameter(0).toEqualTypeOf<string>();
  });

  it("flows the vitest backend into every mock surface", () => {
    const { mocks } = TestBed.solitary(OrderProcessor, { mockFactory: () => vi.fn() }).compile();
    const send = mocks.get(EmailServiceToken).send;

    // Vitest-native APIs type-check without any adapter or module augmentation.
    expectTypeOf(send).toHaveProperty("mockReturnValueOnce");
    expectTypeOf(send).toHaveProperty("mockClear");
    // The intersection keeps the method's own signature callable.
    expectTypeOf<Parameters<typeof send>>().toEqualTypeOf<[string, string]>();
  });

  it("hands the .stub callback the active backend's factory", () => {
    TestBed.solitary(OrderProcessor, { mockFactory: () => vi.fn() })
      .mock(UserServiceToken)
      .stub((fn) => {
        expectTypeOf(fn()).toEqualTypeOf<Mock>();
        return {};
      });
  });

  it("flows a custom backend's own authoring surface", () => {
    // A Sinon-shaped stub: its own API, none of the jest-shaped methods.
    interface FakeSinonStub {
      (...args: ReadonlyArray<unknown>): unknown;
      returns(value: unknown): FakeSinonStub;
      resetHistory(): void;
    }
    const bed = TestBed.solitary(OrderProcessor, {
      mockFactory: () => ({}) as unknown as FakeSinonStub,
    });

    bed.mock(UserServiceToken).stub((fn) => {
      expectTypeOf(fn()).toHaveProperty("returns");
      return {};
    });
  });

  it("steers a sociable bed through expose before anything else", () => {
    const started = TestBed.sociable(OrderProcessor);

    expectTypeOf(started).toHaveProperty("expose");
    expectTypeOf(started).not.toHaveProperty("compile");
    expectTypeOf(started).not.toHaveProperty("mock");
    expectTypeOf(started.expose).returns.toHaveProperty("compile");
  });

  it("rejects a stub seed whose member does not match the dependency", () => {
    const builder = TestBed.solitary(OrderProcessor)
      .mock(UserServiceToken)
      // @ts-expect-error — findUser is a method, so a number seed must not type-check.
      .stub(() => ({ findUser: 42 }));

    expectTypeOf(builder).toHaveProperty("compile");
  });

  it("keeps the default backend precisely typed as Spy", () => {
    const { mocks } = TestBed.solitary(OrderProcessor).compile();

    expectTypeOf(mocks.get(EmailServiceToken).send).toEqualTypeOf<Spy<[to: string, body: string], void>>();
    // The vitest Mock must NOT structurally satisfy Spy, or custom backends would lose their typing.
    expectTypeOf<Mock>().not.toExtend<Spy>();
  });
});
