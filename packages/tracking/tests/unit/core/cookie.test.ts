import { describe, expect, it } from "vitest";

import { readCookieValue } from "#/core/cookie";

describe("readCookieValue", () => {
  it("reads a value out of a multi-cookie string", () => {
    expect(readCookieValue("a=1; target=hello; b=2", "target")).toBe("hello");
  });

  it("tolerates missing spaces and surrounding whitespace", () => {
    expect(readCookieValue("a=1;target= hello ;b=2", "target")).toBe("hello");
  });

  it("returns undefined for an empty, null, or undefined string", () => {
    expect(readCookieValue("", "target")).toBeUndefined();
    expect(readCookieValue(null, "target")).toBeUndefined();
    expect(readCookieValue(undefined, "target")).toBeUndefined();
  });

  it("returns undefined when the cookie is absent", () => {
    expect(readCookieValue("a=1; b=2", "target")).toBeUndefined();
  });

  it("matches the name exactly — a longer prefix sibling is ignored", () => {
    expect(readCookieValue("target-extra=nope", "target")).toBeUndefined();
  });

  it("keeps '=' inside the value intact", () => {
    expect(readCookieValue("target=a=b=c", "target")).toBe("a=b=c");
  });
});
