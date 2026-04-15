import { ArrangeError, ArrangeErrorCode } from "#lib/arrange/domain/errors.domain";

describe("ArrangeError", () => {
  it("preserves code and message", () => {
    const caughtError = new ArrangeError(ArrangeErrorCode.INVALID_INPUT, "bad input");
    expect(caughtError.code).toBe(ArrangeErrorCode.INVALID_INPUT);
    expect(caughtError.message).toBe("bad input");
    expect(caughtError.name).toBe("ArrangeError");
  });
});
