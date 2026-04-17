import { token } from "#/token";
import { inject } from "./inject";

describe("inject", () => {
  it("preserves Symbol keys in tag resolve hints", () => {
    const T = token<number>("inject-test-token");
    const tagKey = Symbol("inject-test-tag");
    const descriptor = inject(T, { tag: [tagKey, "payload"] });

    expect(descriptor.tag).toEqual([tagKey, "payload"]);
  });
});
