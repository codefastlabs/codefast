/**
 * Jest DOM Testing Configuration
 *
 * Set up necessary extensions and mocks for testing:
 * - jest-dom: Provides custom matchers for DOM testing
 * - matchMedia: Mock for system theme detection
 * - BroadcastChannel: Mock for cross-tab theme sync
 */

// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

/* -----------------------------------------------------------------------------
 * Mock: window.matchMedia
 *
 * Required for testing system theme detection (getSystemTheme, resolveTheme)
 * and useSyncExternalStore subscription to OS preference changes.
 * -------------------------------------------------------------------------- */

interface MockMediaQueryList {
  addEventListener: jest.Mock;
  addListener: jest.Mock;
  dispatchEvent: jest.Mock;
  matches: boolean;
  media: string;
  onchange: null;
  removeEventListener: jest.Mock;
  removeListener: jest.Mock;
}

const createMockMediaQueryList = (matches: boolean, media: string): MockMediaQueryList => ({
  addEventListener: jest.fn(),
  addListener: jest.fn(),
  dispatchEvent: jest.fn(),
  matches,
  media,
  onchange: null,
  removeEventListener: jest.fn(),
  removeListener: jest.fn(),
});

Object.defineProperty(window, 'matchMedia', {
  value: jest.fn().mockImplementation((query: string) => {
    // Default: dark mode not preferred
    const matches = query === '(prefers-color-scheme: dark)' ? false : false;

    return createMockMediaQueryList(matches, query);
  }),
  writable: true,
});

/* -----------------------------------------------------------------------------
 * Mock: BroadcastChannel
 *
 * Required for testing cross-tab theme synchronization in ThemeProvider.
 * -------------------------------------------------------------------------- */

class MockBroadcastChannel {
  name: string;
  onmessage: ((event: MessageEvent) => void) | null = null;

  constructor(name: string) {
    this.name = name;
  }

  addEventListener = jest.fn();
  close = jest.fn();
  dispatchEvent = jest.fn();
  postMessage = jest.fn();
  removeEventListener = jest.fn();
}

Object.defineProperty(window, 'BroadcastChannel', {
  value: MockBroadcastChannel,
  writable: true,
});

/* -----------------------------------------------------------------------------
 * Mock: requestAnimationFrame
 *
 * Required for testing disableAnimation() cleanup function.
 * -------------------------------------------------------------------------- */

Object.defineProperty(window, 'requestAnimationFrame', {
  value: (callback: FrameRequestCallback): number => {
    return setTimeout(() => {
      callback(performance.now());
    }, 0) as unknown as number;
  },
  writable: true,
});
