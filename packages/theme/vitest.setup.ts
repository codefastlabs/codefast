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
  addEventListener: vi.fn(),
  addListener: vi.fn(),
  dispatchEvent: vi.fn(),
  matches,
  media,
  onchange: null,
  removeEventListener: vi.fn(),
  removeListener: vi.fn(),
});

Object.defineProperty(window, "matchMedia", {
  value: vi.fn().mockImplementation((query: string) => {
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

  addEventListener = vi.fn();
  close = vi.fn();
  dispatchEvent = vi.fn();
  postMessage = vi.fn();
  removeEventListener = vi.fn();
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
