// Registers @testing-library/jest-dom matchers (toBeInTheDocument, etc.) on
// Vitest's `expect` and augments its types for the whole test suite.
import "@testing-library/jest-dom/vitest";

// jsdom in this setup does not provide localStorage — supply a minimal in-memory Storage.
// Mirrors packages/tracking/vitest.setup.ts, which hits the same gap.
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
