import "@testing-library/jest-dom/vitest";

interface MockMediaQueryList {
  addEventListener: ReturnType<typeof vi.fn>;
  addListener: ReturnType<typeof vi.fn>;
  dispatchEvent: ReturnType<typeof vi.fn>;
  matches: boolean;
  media: string;
  onchange: null;
  removeEventListener: ReturnType<typeof vi.fn>;
  removeListener: ReturnType<typeof vi.fn>;
}

const createMockMediaQueryList = (matches: boolean, media: string): MockMediaQueryList => ({
  addEventListener: vi.fn<(...args: unknown[]) => unknown>(),
  addListener: vi.fn<(...args: unknown[]) => unknown>(),
  dispatchEvent: vi.fn<(...args: unknown[]) => unknown>(),
  matches,
  media,
  onchange: null,
  removeEventListener: vi.fn<(...args: unknown[]) => unknown>(),
  removeListener: vi.fn<(...args: unknown[]) => unknown>(),
});

Object.defineProperty(window, "matchMedia", {
  value: vi.fn<(...args: unknown[]) => unknown>().mockImplementation((query: string) => {
    const matches = query === "(prefers-color-scheme: dark)" ? false : false;

    return createMockMediaQueryList(matches, query);
  }),
  writable: true,
});

class MockBroadcastChannel {
  name: string;
  onmessage: ((event: MessageEvent) => void) | null = null;

  constructor(name: string) {
    this.name = name;
  }

  addEventListener = vi.fn<(...args: unknown[]) => unknown>();
  close = vi.fn<(...args: unknown[]) => unknown>();
  dispatchEvent = vi.fn<(...args: unknown[]) => unknown>();
  postMessage = vi.fn<(...args: unknown[]) => unknown>();
  removeEventListener = vi.fn<(...args: unknown[]) => unknown>();
}

Object.defineProperty(window, "BroadcastChannel", {
  value: MockBroadcastChannel,
  writable: true,
});

Object.defineProperty(window, "requestAnimationFrame", {
  value: (callback: FrameRequestCallback): number => {
    return setTimeout(() => {
      callback(performance.now());
    }, 0) as unknown as number;
  },
  writable: true,
});
