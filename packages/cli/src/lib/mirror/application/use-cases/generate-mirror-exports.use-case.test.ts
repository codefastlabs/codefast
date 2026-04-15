import { createPathTransform } from "#lib/mirror/application/use-cases/generate-mirror-exports.use-case";

describe("createPathTransform", () => {
  const pkgMeta = { packageName: "@acme/widget" };

  it("returns null when path transformations are absent", () => {
    expect(createPathTransform(undefined, pkgMeta)).toBeNull();
    expect(createPathTransform({}, pkgMeta)).toBeNull();
  });

  it("returns null when removePrefix is missing", () => {
    expect(
      createPathTransform({ pathTransformations: { [pkgMeta.packageName]: {} } }, pkgMeta),
    ).toBeNull();
  });

  it("strips a configured prefix and normalizes relative paths", () => {
    const transform = createPathTransform(
      {
        pathTransformations: {
          [pkgMeta.packageName]: { removePrefix: "./dist/" },
        },
      },
      pkgMeta,
    );
    expect(transform).not.toBeNull();
    if (transform === null) {
      return;
    }
    expect(transform("./dist/index.js")).toBe("./index.js");
    expect(transform("./dist/foo/bar.js")).toBe("./foo/bar.js");
    expect(transform("./other.js")).toBe("./other.js");
  });

  it("returns the path unchanged when it does not start with the prefix", () => {
    const transform = createPathTransform(
      {
        pathTransformations: {
          [pkgMeta.packageName]: { removePrefix: "./dist/" },
        },
      },
      pkgMeta,
    );
    expect(transform).not.toBeNull();
    if (transform === null) {
      return;
    }
    expect(transform("unrelated.js")).toBe("unrelated.js");
  });
});
