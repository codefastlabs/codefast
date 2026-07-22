import "@testing-library/jest-dom/vitest";
import { createMockMediaQueryList } from "#/tests/unit/support/mocks";

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

// jsdom in this setup does not provide localStorage — supply a minimal in-memory Storage.
class MockStorage implements Storage {
  private readonly store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.store.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

Object.defineProperty(window, "localStorage", {
  value: new MockStorage(),
  writable: true,
});
