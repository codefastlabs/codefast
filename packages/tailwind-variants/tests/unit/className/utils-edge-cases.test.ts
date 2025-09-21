import { cn, cx, isBooleanValueType, isSlotObjectType } from "@/utils";

describe("Tailwind Variants (TV) - Utils Edge Cases", () => {
  describe("cx function edge cases", () => {
    test("should handle empty array", () => {
      expect(cx()).toBe("");
    });

    test("should handle single string argument", () => {
      expect(cx("flex")).toBe("flex");
    });

    test("should handle single falsy argument", () => {
      expect(cx(false)).toBe("");
      expect(cx(null)).toBe("");
      expect(cx()).toBe("");
      expect(cx(0)).toBe("");
      expect(cx("")).toBe("");
    });

    test("should handle single non-string truthy argument", () => {
      expect(cx(["flex", "items-center"])).toBe("flex items-center");
      expect(cx({ "bg-blue-500": true, "bg-red-500": false })).toBe("bg-blue-500");
    });

    test("should handle multiple arguments with clsx", () => {
      expect(cx("flex", { "bg-blue-500": true }, ["items-center", "justify-center"])).toBe(
        "flex bg-blue-500 items-center justify-center",
      );
    });
  });

  describe("cn function edge cases", () => {
    test("should handle empty array", () => {
      expect(cn()).toBe("");
    });

    test("should handle single string argument with twMerge", () => {
      expect(cn("bg-red-500 bg-blue-500")).toBe("bg-blue-500");
    });

    test("should handle single falsy argument", () => {
      expect(cn(false)).toBe("");
      expect(cn(null)).toBe("");
      expect(cn()).toBe("");
      expect(cn(0)).toBe("");
      expect(cn("")).toBe("");
    });

    test("should handle single non-string truthy argument with twMerge", () => {
      expect(cn(["bg-red-500", "bg-blue-500"])).toBe("bg-blue-500");
      expect(cn({ "bg-red-500": true, "bg-blue-500": true })).toBe("bg-blue-500");
    });

    test("should handle multiple arguments with clsx and twMerge", () => {
      expect(cn("bg-red-500", { "bg-blue-500": true }, ["text-sm", "text-lg"])).toBe(
        "bg-blue-500 text-lg",
      );
    });
  });

  describe("isBooleanValueType edge cases", () => {
    test("should correctly identify boolean values", () => {
      expect(isBooleanValueType(true)).toBe(true);
      expect(isBooleanValueType(false)).toBe(true);
    });

    test("should correctly reject non-boolean values", () => {
      expect(isBooleanValueType("true")).toBe(false);
      expect(isBooleanValueType("false")).toBe(false);
      expect(isBooleanValueType(1)).toBe(false);
      expect(isBooleanValueType(0)).toBe(false);
      expect(isBooleanValueType(null)).toBe(false);
      expect(isBooleanValueType()).toBe(false);
      expect(isBooleanValueType({})).toBe(false);
      expect(isBooleanValueType([])).toBe(false);
    });
  });

  describe("isSlotObjectType edge cases", () => {
    test("should correctly identify slot objects", () => {
      expect(isSlotObjectType({ base: "class1", item: "class2" })).toBe(true);
      expect(isSlotObjectType({ singleSlot: "class" })).toBe(true);
      expect(isSlotObjectType({})).toBe(true); // Empty object is still an object
    });

    test("should correctly reject non-slot-object values", () => {
      expect(isSlotObjectType("string")).toBe(false);
      expect(isSlotObjectType(123)).toBe(false);
      expect(isSlotObjectType(true)).toBe(false);
      expect(isSlotObjectType(false)).toBe(false);
      expect(isSlotObjectType(null)).toBe(false);
      expect(isSlotObjectType()).toBe(false);
      expect(isSlotObjectType([])).toBe(false);
      expect(
        isSlotObjectType(() => {
          /* empty function for test */
        }),
      ).toBe(false);
    });

    test("should handle complex object structures", () => {
      // Objects with string values should be considered slot objects
      expect(
        isSlotObjectType({
          nested: { deep: "value" },
          simple: "class",
        }),
      ).toBe(true);

      // Objects with non-string values should still be considered slot objects
      // as the type guard only checks if it's an object
      expect(
        isSlotObjectType({
          array: ["item"],
          boolean: true,
          number: 123,
        }),
      ).toBe(true);
    });

    test("should handle prototype chain objects", () => {
      const object = Object.create({ inherited: "value" }) as Record<string, unknown>;

      object.own = "property";
      expect(isSlotObjectType(object)).toBe(true);
    });
  });
});
