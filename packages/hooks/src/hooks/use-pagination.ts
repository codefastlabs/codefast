import { useMemo } from 'react';

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
export const ELLIPSIS = '•••';

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
 * ```typescript
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
    // Calculate the total number of pages based on total results and results
    // per page
    const totalPages = Math.ceil(totalResults / Math.floor(resultsPerPage));

    // Return an empty array if there are no pages to display
    if (totalPages <= 0) {
      return [];
    }

    // The total number of pagination items to show, including first, last,
    // current, and sibling pages
    const visiblePageNumbers = siblingPagesCount + 5;

    /**
     * Case 1: If the number of pages is less than or equal to the visible page
     * numbers, return an array of all page numbers.
     */
    if (visiblePageNumbers >= totalPages) {
      return createRange(1, totalPages);
    }

    // Determine the left and right sibling page indexes, ensuring they stay
    // within valid bounds
    const leftSiblingIndex = Math.max(currentPage - siblingPagesCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingPagesCount, totalPages);

    // Determine whether to show ellipsis on the left or right of the pagination
    const shouldShowLeftEllipsis = leftSiblingIndex > 2;
    const shouldShowRightEllipsis = rightSiblingIndex < totalPages - 2;

    // Define the first and last pages in the pagination structure
    const firstPage = 1;
    const lastPage = totalPages;

    /**
     * Case 2: No left ellipsis, but right ellipsis is necessary.
     * This occurs when the current page is close to the start of the
     * pagination range.
     */
    if (!shouldShowLeftEllipsis && shouldShowRightEllipsis) {
      const leftRange = createRange(1, 3 + 2 * siblingPagesCount);

      return [...leftRange, ELLIPSIS, lastPage];
    }

    /**
     * Case 3: No right ellipsis, but left ellipsis is necessary.
     * This occurs when the current page is close to the end of the pagination
     * range.
     */
    if (shouldShowLeftEllipsis && !shouldShowRightEllipsis) {
      const rightRange = createRange(totalPages - (3 + 2 * siblingPagesCount) + 1, totalPages);

      return [firstPage, ELLIPSIS, ...rightRange];
    }

    /**
     * Case 4: Both left and right ellipsis are necessary.
     * This occurs when the current page is far enough from both the start and
     * end of the pagination range.
     */
    if (shouldShowLeftEllipsis && shouldShowRightEllipsis) {
      const middleRange = createRange(leftSiblingIndex, rightSiblingIndex);

      return [firstPage, ELLIPSIS, ...middleRange, ELLIPSIS, lastPage];
    }

    return [];
  }, [totalResults, resultsPerPage, siblingPagesCount, currentPage]);
}
