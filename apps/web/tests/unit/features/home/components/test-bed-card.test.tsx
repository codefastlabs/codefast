import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { TestBedCard } from "#/features/home/components/test-bed-card";
import { SHOP_TESTS } from "#/features/home/demos/shop-tests";

vi.mock("#/features/tracking/lib/tracking", () => ({ track: vi.fn() }));

// jsdom has no IntersectionObserver; this one reports every target as visible at once, so the lazy footer mounts.
beforeAll(() => {
  class VisibleObserver {
    readonly #callback: IntersectionObserverCallback;

    constructor(callback: IntersectionObserverCallback) {
      this.#callback = callback;
    }

    observe(target: Element): void {
      this.#callback([{ isIntersecting: true, target } as IntersectionObserverEntry], this as never);
    }

    disconnect(): void {}

    unobserve(): void {}

    takeRecords(): Array<IntersectionObserverEntry> {
      return [];
    }
  }

  vi.stubGlobal("IntersectionObserver", VisibleObserver);
});

afterEach(() => {
  cleanup();
});

const snippet = {
  imports: `<pre class="shiki"><code>import { TestBed } from "@codefast/di-testing";</code></pre>`,
  tests: SHOP_TESTS.map((test, index) => ({
    title: test.title,
    html: `<pre class="shiki"><code>it("${test.title}", () => { /* body ${index} */ });</code></pre>`,
  })),
};

describe("TestBedCard", () => {
  it("shows one tab per test under its label, the first open, and the imports folded", () => {
    render(<TestBedCard snippet={snippet} />);

    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual(SHOP_TESTS.map((test) => test.label));
    expect(screen.getByText(/body 0/)).toBeInTheDocument();
    expect(screen.queryByText(/body 1/)).not.toBeInTheDocument();
    expect(screen.getByText(/imports, from \.\/shop/)).toBeInTheDocument();
  });

  it("switches the code with the tab and hands the open test to the runner", async () => {
    const user = userEvent.setup();

    render(<TestBedCard snippet={snippet} />);

    await user.click(screen.getByRole("tab", { name: "Refuse a typo" }));

    expect(screen.getByText(/body 3/)).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /run all four/i }, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByText("not run yet")).toBeInTheDocument();
  });
});
