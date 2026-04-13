import type { Dirent } from "node:fs";
import { isDirentList } from "#lib/shared/utils";

describe("isDirentList", () => {
  it("documents that an empty array is intentionally accepted as Dirent[]", () => {
    expect(isDirentList([])).toBe(true);
  });

  it("documents that string arrays are rejected as non-Dirent lists", () => {
    expect(isDirentList(["a", "b"])).toBe(false);
  });

  it("documents that objects exposing Dirent shape are accepted", () => {
    const direntLike = {
      isFile: () => true,
      isDirectory: () => false,
    } as Dirent;
    expect(isDirentList([direntLike])).toBe(true);
  });
});
