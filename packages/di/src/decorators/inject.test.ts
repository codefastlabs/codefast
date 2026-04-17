import { DiError } from "#/errors";
import { token } from "#/token";
import { inject } from "./inject";

describe("inject", () => {
  it("preserves Symbol keys in tag resolve hints", () => {
    const T = token<number>("inject-test-token");
    const tagKey = Symbol("inject-test-tag");
    const descriptor = inject(T, { tag: [tagKey, "payload"] });

    expect(descriptor.tag).toEqual([tagKey, "payload"]);
  });

  it("throws when tag tuple is malformed", () => {
    const T = token<number>("inject-test-bad-tag");
    expect(() =>
      inject(T, {
        // @ts-expect-error — exercise runtime validation for non-string/symbol tag keys
        tag: [1, 2],
      }),
    ).toThrow(DiError);
  });
});
