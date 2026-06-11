import "@testing-library/jest-dom/vitest";
import { createMockMediaQueryList } from "#/tests/support/mocks";

Object.defineProperty(window, "matchMedia", {
  value: vi.fn().mockImplementation((query: string) => createMockMediaQueryList(false, query)),
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
