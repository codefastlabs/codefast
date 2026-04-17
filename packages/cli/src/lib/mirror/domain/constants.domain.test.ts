import { DIST_DIR, PACKAGE_JSON } from "#/lib/mirror/domain/constants.domain";

describe("mirror domain constants", () => {
  it("uses stable path segments for package layout", () => {
    expect(DIST_DIR).toBe("dist");
    expect(PACKAGE_JSON).toBe("package.json");
  });
});
