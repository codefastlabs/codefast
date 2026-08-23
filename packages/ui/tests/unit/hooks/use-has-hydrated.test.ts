import { renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

import { useHasHydrated } from "#/hooks/use-has-hydrated";

function HydrationProbe() {
  return createElement("span", null, String(useHasHydrated()));
}

describe("useHasHydrated", () => {
  test("reports false during server rendering", () => {
    expect(renderToString(createElement(HydrationProbe))).toContain("false");
  });

  test("reports true on the client", () => {
    const { result } = renderHook(() => useHasHydrated());

    expect(result.current).toBe(true);
  });
});
