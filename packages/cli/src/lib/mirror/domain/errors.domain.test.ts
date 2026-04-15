import { MirrorError, MirrorErrorCode } from "#lib/mirror/domain/errors.domain";

describe("MirrorError", () => {
  it("preserves code and message", () => {
    const caughtError = new MirrorError(MirrorErrorCode.PACKAGE_WRITE, "write blocked");
    expect(caughtError.code).toBe(MirrorErrorCode.PACKAGE_WRITE);
    expect(caughtError.message).toBe("write blocked");
    expect(caughtError.name).toBe("MirrorError");
  });
});
