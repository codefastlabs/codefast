import { renderHook } from "@testing-library/react";

import { ELLIPSIS, usePagination } from "@/use-pagination";

describe("usePagination", () => {
  it("returns an empty array when totalResults is 0", () => {
    const { result } = renderHook(() =>
      usePagination({
        currentPage: 1,
        resultsPerPage: 10,
        totalResults: 0,
      }),
    );

    expect(result.current).toEqual([]);
  });

  it("returns all page numbers when pages are less than or equal to visiblePageNumbers", () => {
    const { result } = renderHook(() =>
      usePagination({
        currentPage: 1,
        resultsPerPage: 10,
        siblingPagesCount: 1,
        totalResults: 30,
      }),
    );

    expect(result.current).toEqual([1, 2, 3]);
  });

  it("returns correct pagination structure when right ellipsis is necessary", () => {
    const { result } = renderHook(() =>
      usePagination({
        currentPage: 1,
        resultsPerPage: 10,
        siblingPagesCount: 1,
        totalResults: 100,
      }),
    );

    expect(result.current).toEqual([1, 2, 3, 4, 5, ELLIPSIS, 10]);
  });

  it("returns correct pagination structure when left ellipsis is necessary", () => {
    const { result } = renderHook(() =>
      usePagination({
        currentPage: 10,
        resultsPerPage: 10,
        siblingPagesCount: 1,
        totalResults: 100,
      }),
    );

    expect(result.current).toEqual([1, ELLIPSIS, 6, 7, 8, 9, 10]);
  });

  it("returns correct pagination structure when both ellipses are necessary", () => {
    const { result } = renderHook(() =>
      usePagination({
        currentPage: 5,
        resultsPerPage: 10,
        siblingPagesCount: 1,
        totalResults: 100,
      }),
    );

    expect(result.current).toEqual([1, ELLIPSIS, 4, 5, 6, ELLIPSIS, 10]);
  });
});
