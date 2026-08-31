import { describe, expectTypeOf, it } from "vitest";

import type { Mocked } from "#/mocking/auto-mock";
import { TestBed } from "#/test-bed/test-bed";
import type { EmailService, UserService } from "#/tests/unit/support/fixtures";
import { EmailServiceToken, OrderProcessor, UserServiceToken } from "#/tests/unit/support/fixtures";

describe("UnitReference.get", () => {
  it("types the unit as the class under test", () => {
    const { unit } = TestBed.solitary(OrderProcessor).compile();
    expectTypeOf(unit).toEqualTypeOf<OrderProcessor>();
  });

  it("maps a token to the mocked value type", () => {
    const { unitRef } = TestBed.solitary(OrderProcessor).compile();

    expectTypeOf(unitRef.get(EmailServiceToken)).toEqualTypeOf<Mocked<EmailService>>();
    expectTypeOf(unitRef.get(UserServiceToken)).toEqualTypeOf<Mocked<UserService>>();
    expectTypeOf(unitRef.get(EmailServiceToken).send).parameter(0).toEqualTypeOf<string>();
  });
});
