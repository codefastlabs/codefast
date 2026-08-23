import { renderHook } from "@testing-library/react";
import { useLayoutEffect } from "react";

import { useLatest } from "#/hooks/use-latest";

describe("useLatest", () => {
  test("holds the initial value on mount", () => {
    const { result } = renderHook(() => useLatest("first"));

    expect(result.current.current).toBe("first");
  });

  test("keeps the same ref object across renders", () => {
    const { rerender, result } = renderHook(({ value }) => useLatest(value), {
      initialProps: { value: "first" },
    });

    const initialRef = result.current;

    rerender({ value: "second" });

    expect(result.current).toBe(initialRef);
    expect(result.current.current).toBe("second");
  });

  // The mirror must run in a layout effect: message-scroller reads these refs from
  // same-commit layout effects and MutationObserver microtasks, which both run before
  // a passive-effect mirror would.
  test("is fresh inside a same-commit layout effect declared after it", () => {
    const seen: Array<string> = [];

    const { rerender } = renderHook(
      ({ value }) => {
        const ref = useLatest(value);

        useLayoutEffect(() => {
          seen.push(ref.current);
        }, [ref, value]);
      },
      { initialProps: { value: "first" } },
    );

    rerender({ value: "second" });

    expect(seen).toEqual(["first", "second"]);
  });
});
