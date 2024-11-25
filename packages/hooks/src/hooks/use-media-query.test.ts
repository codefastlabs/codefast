import { act, renderHook } from '@testing-library/react';
import { describe, expect, type Mock, vi } from 'vitest';

import { useMediaQuery } from './use-media-query';

const setupMockMatchMedia = (
  matches: boolean,
): {
  mockAddEventListener: Mock<(type: 'change', listener: (event: MediaQueryListEvent) => void) => void>;
  mockMediaQueryList: {
    addEventListener: Mock<(type: 'change', listener: (event: MediaQueryListEvent) => void) => void>;
    matches: boolean;
    media: string;
    onchange: null;
    removeEventListener: Mock;
  };
  mockRemoveEventListener: Mock;
} => {
  const mockAddEventListener = vi.fn<(type: 'change', listener: (event: MediaQueryListEvent) => void) => void>();
  const mockRemoveEventListener = vi.fn();

  const mockMediaQueryList = {
    matches,
    media: '',
    addEventListener: mockAddEventListener,
    removeEventListener: mockRemoveEventListener,
    onchange: null,
  };

  window.matchMedia = vi.fn().mockImplementation(() => mockMediaQueryList);

  return { mockMediaQueryList, mockAddEventListener, mockRemoveEventListener };
};

describe('useMediaQuery', () => {
  test('should return true when media query matches', () => {
    const { mockMediaQueryList } = setupMockMatchMedia(true);

    const { result } = renderHook(() => useMediaQuery('(min-width: 600px)'));

    expect(result.current).toBe(true);
    expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 600px)');
    expect(mockMediaQueryList.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  test('should return false when media query does not match', () => {
    setupMockMatchMedia(false);

    const { result } = renderHook(() => useMediaQuery('(min-width: 600px)'));

    expect(result.current).toBe(false);
    expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 600px)');
  });

  test('should update when media query changes', () => {
    const { mockMediaQueryList, mockAddEventListener } = setupMockMatchMedia(false);

    const { result } = renderHook(() => useMediaQuery('(min-width: 600px)'));

    expect(result.current).toBe(false);

    act(() => {
      const changeHandler = mockAddEventListener.mock.calls[0][1];

      mockMediaQueryList.matches = true;
      changeHandler({ matches: true } as MediaQueryListEvent);
    });

    expect(result.current).toBe(true);
  });

  test('should clean up event listener on unmount', () => {
    const { mockMediaQueryList, mockRemoveEventListener } = setupMockMatchMedia(true);

    const { unmount } = renderHook(() => useMediaQuery('(min-width: 600px)'));

    expect(mockMediaQueryList.addEventListener).toHaveBeenCalled();

    unmount();
    expect(mockRemoveEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  test('should re-add listener when query changes', () => {
    const { mockAddEventListener, mockRemoveEventListener } = setupMockMatchMedia(false);

    const { rerender } = renderHook((query) => useMediaQuery(query), {
      initialProps: '(min-width: 600px)',
    });

    expect(mockAddEventListener).toHaveBeenCalledWith('change', expect.any(Function));

    rerender('(min-width: 800px)');
    expect(mockRemoveEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 800px)');
  });
});
