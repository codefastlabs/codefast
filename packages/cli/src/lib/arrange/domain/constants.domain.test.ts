import { LONG_STRING_TOKEN_THRESHOLD } from "#lib/arrange/domain/constants.domain";

describe("arrange domain constants", () => {
  it("exposes stable defaults for CLI and analysis thresholds", () => {
    expect(LONG_STRING_TOKEN_THRESHOLD).toBeGreaterThan(0);
  });
});
