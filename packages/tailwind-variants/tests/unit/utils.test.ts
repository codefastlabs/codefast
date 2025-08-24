import {
  falsyToString,
  flat,
  flatMergeArrays,
  isEmptyObject,
  isEqual,
  mergeObjects,
} from "@/utils";

describe("falsyToString", () => {
  test("should return a string when given a boolean", () => {
    expect(falsyToString(true)).toBe("true");
    expect(falsyToString(false)).toBe("false");
  });

  test("should return 0 when given 0", () => {
    expect(falsyToString(0)).toBe("0");
  });

  test("should return the original value when given a value other than 0 or a boolean", () => {
    expect(falsyToString("test")).toBe("test");
    expect(falsyToString(4)).toBe(4);
    expect(falsyToString(null)).toBeNull();
  });

  test("should work with generic types", () => {
    const result = falsyToString<boolean>(true);

    expect(result).toBe("true");
  });
});

describe("flat", () => {
  test("should flatten nested arrays", () => {
    const source = [1, [2, [3, 4]], 5];
    const target: number[] = [];

    flat(source, target);
    expect(target).toEqual([1, 2, 3, 4, 5]);
  });

  test("should work with generic types", () => {
    const source = ["a", ["b", ["c"]]];
    const target: string[] = [];

    flat(source, target);
    expect(target).toEqual(["a", "b", "c"]);
  });
});

describe("flatMergeArrays", () => {
  test("should merge arrays and filter null/undefined", () => {
    const result = flatMergeArrays([1, 2], [3, null], [undefined, 4]);

    expect(result).toEqual([1, 2, 3, 4]);
  });

  test("should work with generic types", () => {
    const result = flatMergeArrays<string>(["a", "b"], ["c", null], [undefined, "d"]);

    expect(result).toEqual(["a", "b", "c", "d"]);
  });
});

describe("isEmptyObject", () => {
  test("should identify empty objects", () => {
    expect(isEmptyObject({})).toBe(true);
    expect(isEmptyObject({ key: "value" })).toBe(false);
    expect(isEmptyObject(null)).toBe(true);
    expect(isEmptyObject(undefined)).toBe(true);
  });

  test("should work as type predicate", () => {
    const value: unknown = {};

    if (isEmptyObject(value)) {
      expect(value).toEqual({}); // TypeScript knows this is empty object
    }
  });
});

describe("isEqual", () => {
  test("should compare objects for equality", () => {
    expect(isEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
    expect(isEqual({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false);
    expect(isEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });

  test("should work with generic types", () => {
    const obj1 = { x: "test", y: 123 };
    const obj2 = { x: "test", y: 123 };

    expect(isEqual(obj1, obj2)).toBe(true);
  });
});

describe("mergeObjects", () => {
  test("should merge objects deeply", () => {
    const base = { a: 1, b: { c: 2 } };
    const override = { b: { d: 3 }, e: 4 };
    const result = mergeObjects(base, override);

    expect(result).toEqual({ a: 1, b: { c: 2, d: 3 }, e: 4 });
  });

  test("should work with generic types", () => {
    const base = { x: "base" };
    const override = { y: "override" };
    const result = mergeObjects(base, override);

    expect(result).toEqual({ x: "base", y: "override" });
  });
});
