'use client';

import { useMemo } from 'react';

export interface UsePaginationProps {
  /** Current active page number. */
  currentPage: number;
  /** Number of results displayed per page. */
  resultsPerPage: number;
  /**
   * Number of sibling pages to show on each side of the current page.
   * Defaults to 1.
   */
  siblingPagesCount?: number;
  /** Total number of results across all pages. */
  totalResults: number;
}

/** Ellipsis marker used to collapse ranges in pagination output. */
export const ELLIPSIS = '•••';

/**
 * Generate a numeric range from start to end inclusive.
 *
 * @param start - Starting number (inclusive).
 * @param end - Ending number (inclusive).
 * @returns Array of numbers from start to end.
 */
const createRange = (start: number, end: number): number[] => {
  const length = end - start + 1;

  return Array.from({ length }, (_, index) => start + index);
};

/**
 * Compute a pagination structure for result sets.
 *
 * Returns a mixed array of page numbers and the `ELLIPSIS` marker representing
 * collapsed ranges. The shape adapts to the total pages and the requested
 * sibling window around the current page.
 *
 * @param props - Pagination options. See {@link UsePaginationProps}.
 * @returns Array of page numbers and `ELLIPSIS` representing the pagination model.
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
    // Total pages derived from results and page size
    const totalPages = Math.ceil(totalResults / Math.floor(resultsPerPage));

    // Return an empty array if there are no pages to display
    if (totalPages <= 0) {
      return [];
    }

    /**
     * Total visible items including: first, last, current, siblings, and two ellipses.
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
     * Left sibling boundary (min 1).
     */
    const leftSiblingIndex = Math.max(currentPage - siblingPagesCount, 1);

    /**
     * Right sibling boundary (max totalPages).
     */
    const rightSiblingIndex = Math.min(currentPage + siblingPagesCount, totalPages);

    /**
     * Whether a left-side ellipsis is needed.
     */
    const shouldShowLeftEllipsis = leftSiblingIndex > 2;

    /**
     * Whether a right-side ellipsis is needed.
     */
    const shouldShowRightEllipsis = rightSiblingIndex < totalPages - 2;

    /** First page number (always 1). */
    const firstPage = 1;

    /** Last page number (equals totalPages). */
    const lastPage = totalPages;

    /**
     * Case 2: No left ellipsis, but right ellipsis is necessary.
     * This occurs when the current page is close to the start of the
     * pagination range.
     */
    if (!shouldShowLeftEllipsis && shouldShowRightEllipsis) {
      // Range starting from page 1 through the right sibling window
      const leftRange = createRange(1, 3 + 2 * siblingPagesCount);

      return [...leftRange, ELLIPSIS, lastPage];
    }

    /**
     * Case 3: No right ellipsis, but left ellipsis is necessary.
     * This occurs when the current page is close to the end of the pagination
     * range.
     */
    if (shouldShowLeftEllipsis && !shouldShowRightEllipsis) {
      // Range ending at last page through the left sibling window
      const rightRange = createRange(totalPages - (3 + 2 * siblingPagesCount) + 1, totalPages);

      return [firstPage, ELLIPSIS, ...rightRange];
    }

    /**
     * Case 4: Both left and right ellipsis are necessary.
     * This occurs when the current page is far enough from both the start and
     * end of the pagination range.
     */
    if (shouldShowLeftEllipsis && shouldShowRightEllipsis) {
      // Middle window from left to right siblings
      const middleRange = createRange(leftSiblingIndex, rightSiblingIndex);

      return [firstPage, ELLIPSIS, ...middleRange, ELLIPSIS, lastPage];
    }

    return [];
  }, [totalResults, resultsPerPage, siblingPagesCount, currentPage]);
}
