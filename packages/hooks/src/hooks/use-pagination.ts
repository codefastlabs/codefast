import { useMemo } from "react";

export interface UsePaginationProps {
  /** The current active page number */
  currentPage: number;
  /** The number of results to display per page */
  resultsPerPage: number;
  /** The total number of results across all pages */
  totalResults: number;
  /**
   * The number of sibling pages to display on either side of the current page.
   * Defaults to 1.
   */
  siblingPagesCount?: number;
}

/** Constant representing the ellipsis ("...") used in pagination */
export const ELLIPSIS = "•••";

/**
 * Generates an array of numbers representing a range between the start and end
 * values (inclusive).
 *
 * @param start - The starting number of the range
 * @param end - The ending number of the range
 * @returns An array of numbers from start to end
 */
const createRange = (start: number, end: number): number[] => {
  const length = end - start + 1;

  return Array.from({ length }, (_, i) => start + i);
};

/**
 * A custom hook that calculates the pagination logic for a given set of
 * results.
 *
 * @param props - An object containing the pagination properties
 * @returns An array representing the pagination structure, which includes page
 *   numbers and ellipsis indicators
 *
 * @example
 * ```tsx
 * const paginationRange = usePagination({
 *   currentPage: 3,
 *   resultsPerPage: 10,
 *   siblingPagesCount: 1,
 *   totalResults: 100
 * });
 * ```
 */
export function usePagination({
  currentPage,
  resultsPerPage,
  siblingPagesCount = 1,
  totalResults,
}: UsePaginationProps): (number | string)[] {
  return useMemo<(number | string)[]>(() => {
    /**
     * The total number of pages calculated from total results divided by results per page
     */
    const totalPages = Math.ceil(totalResults / Math.floor(resultsPerPage));

    // Return an empty array if there are no pages to display
    if (totalPages <= 0) {
      return [];
    }

    /**
     * The total number of pagination items to show, including first, last,
     * current, and sibling pages (calculated as siblings on both sides + current page + first + last + 2 dots)
     */
    const visiblePageNumbers = siblingPagesCount + 5;

    /**
     * Case 1: If the number of pages is less than or equal to the visible page
     * numbers, return an array of all page numbers.
     */
    if (visiblePageNumbers >= totalPages) {
      return createRange(1, totalPages);
    }

    /**
     * The leftmost sibling page index, ensuring it's not less than the first page
     */
    const leftSiblingIndex = Math.max(currentPage - siblingPagesCount, 1);

    /**
     * The rightmost sibling page index, ensuring it's not greater than the last page
     */
    const rightSiblingIndex = Math.min(currentPage + siblingPagesCount, totalPages);

    /**
     * Flag indicating whether to show ellipsis on the left side of the pagination
     */
    const shouldShowLeftEllipsis = leftSiblingIndex > 2;

    /**
     * Flag indicating whether to show ellipsis on the right side of the pagination
     */
    const shouldShowRightEllipsis = rightSiblingIndex < totalPages - 2;

    /** The first page number, always 1 */
    const firstPage = 1;

    /** The last page number, equal to the total pages calculated */
    const lastPage = totalPages;

    /**
     * Case 2: No left ellipsis, but right ellipsis is necessary.
     * This occurs when the current page is close to the start of the
     * pagination range.
     */
    if (!shouldShowLeftEllipsis && shouldShowRightEllipsis) {
      /**
       * Range of page numbers to display from the start, including the current page and siblings
       */
      const leftRange = createRange(1, 3 + 2 * siblingPagesCount);

      return [...leftRange, ELLIPSIS, lastPage];
    }

    /**
     * Case 3: No right ellipsis, but left ellipsis is necessary.
     * This occurs when the current page is close to the end of the pagination
     * range.
     */
    if (shouldShowLeftEllipsis && !shouldShowRightEllipsis) {
      /**
       * Range of page numbers to display at the end, including the current page and siblings
       */
      const rightRange = createRange(totalPages - (3 + 2 * siblingPagesCount) + 1, totalPages);

      return [firstPage, ELLIPSIS, ...rightRange];
    }

    /**
     * Case 4: Both left and right ellipsis are necessary.
     * This occurs when the current page is far enough from both the start and
     * end of the pagination range.
     */
    if (shouldShowLeftEllipsis && shouldShowRightEllipsis) {
      /**
       * Range of page numbers to display in the middle, including the current page and siblings
       */
      const middleRange = createRange(leftSiblingIndex, rightSiblingIndex);

      return [firstPage, ELLIPSIS, ...middleRange, ELLIPSIS, lastPage];
    }

    return [];
  }, [totalResults, resultsPerPage, siblingPagesCount, currentPage]);
}
