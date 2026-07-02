import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import { renderToString } from "react-dom/server";

import type { Appearance } from "#/appearance";
import { AppearanceProvider } from "#/appearance-provider";
import { DEFAULT_COLOR_SCHEME, STORAGE_KEY, SYNC_CHANNEL } from "#/constants";
import { createMockMediaQueryList, mockMatchMedia } from "#/tests/support/mocks";
import { useAppearance } from "#/use-appearance";

// Dispatch a storage-like event. Builds it via Event + defineProperties rather than the
// `new StorageEvent(type, init)` overload, which static analysis flags as superfluous args.
function dispatchStorageEvent(key: null | string, newValue: null | string): void {
  const event = new Event("storage");

  Object.defineProperties(event, {
    key: { value: key },
    newValue: { value: newValue },
  });

  window.dispatchEvent(event);
}

describe("AppearanceProvider", () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    // Reset document state
    document.documentElement.className = "";
    document.documentElement.style.colorScheme = "";

    // storageKey defaults to STORAGE_KEY, so stale entries would leak into unrelated tests
    window.localStorage.clear();

    // Default matchMedia mock (light mode)
    mockMatchMedia();
  });

  afterEach(() => {
    Object.defineProperty(window, "matchMedia", {
      value: originalMatchMedia,
      writable: true,
    });
  });

  describe("rendering", () => {
    test("should render children", () => {
      render(
        <AppearanceProvider appearance="light">
          <div data-testid="child">Child Content</div>
        </AppearanceProvider>,
      );

      expect(screen.getByTestId("child")).toHaveTextContent("Child Content");
    });

    test("should render multiple children", () => {
      render(
        <AppearanceProvider appearance="dark">
          <div data-testid="child1">Child 1</div>
          <div data-testid="child2">Child 2</div>
        </AppearanceProvider>,
      );

      expect(screen.getByTestId("child1")).toBeInTheDocument();
      expect(screen.getByTestId("child2")).toBeInTheDocument();
    });
  });

  describe("color scheme context", () => {
    test("should provide initial color scheme via context", () => {
      const TestConsumer = (): React.ReactElement => {
        const { appearance } = useAppearance();

        return <span data-testid="appearance">{appearance}</span>;
      };

      render(
        <AppearanceProvider appearance="dark">
          <TestConsumer />
        </AppearanceProvider>,
      );

      expect(screen.getByTestId("appearance")).toHaveTextContent("dark");
    });

    test("should provide resolved color scheme for explicit schemes", () => {
      const TestConsumer = (): React.ReactElement => {
        const { colorScheme } = useAppearance();

        return <span data-testid="resolved">{colorScheme}</span>;
      };

      render(
        <AppearanceProvider appearance="light">
          <TestConsumer />
        </AppearanceProvider>,
      );

      expect(screen.getByTestId("resolved")).toHaveTextContent("light");
    });

    test('should resolve "automatic" color scheme to OS preference (light)', () => {
      mockMatchMedia(() => createMockMediaQueryList(false, ""));

      const TestConsumer = (): React.ReactElement => {
        const { colorScheme, appearance } = useAppearance();

        return (
          <>
            <span data-testid="appearance">{appearance}</span>
            <span data-testid="resolved">{colorScheme}</span>
          </>
        );
      };

      render(
        <AppearanceProvider appearance="automatic">
          <TestConsumer />
        </AppearanceProvider>,
      );

      expect(screen.getByTestId("appearance")).toHaveTextContent("automatic");
      expect(screen.getByTestId("resolved")).toHaveTextContent("light");
    });

    test('should resolve "automatic" color scheme to OS preference (dark)', () => {
      mockMatchMedia((query) => createMockMediaQueryList(query === "(prefers-color-scheme: dark)", query));

      const TestConsumer = (): React.ReactElement => {
        const { colorScheme } = useAppearance();

        return <span data-testid="resolved">{colorScheme}</span>;
      };

      render(
        <AppearanceProvider appearance="automatic">
          <TestConsumer />
        </AppearanceProvider>,
      );

      expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
    });

    test("should provide isPending as false initially", () => {
      const TestConsumer = (): React.ReactElement => {
        const { isPending } = useAppearance();

        return <span data-testid="pending">{String(isPending)}</span>;
      };

      render(
        <AppearanceProvider appearance="dark">
          <TestConsumer />
        </AppearanceProvider>,
      );

      expect(screen.getByTestId("pending")).toHaveTextContent("false");
    });

    test("should provide setAppearance function", () => {
      const TestConsumer = (): React.ReactElement => {
        const { setAppearance } = useAppearance();

        return <span data-testid="hasSetAppearance">{typeof setAppearance}</span>;
      };

      render(
        <AppearanceProvider appearance="dark">
          <TestConsumer />
        </AppearanceProvider>,
      );

      expect(screen.getByTestId("hasSetAppearance")).toHaveTextContent("function");
    });
  });

  describe("DOM updates", () => {
    test("should apply color scheme class to html element on mount", async () => {
      render(
        <AppearanceProvider appearance="dark">
          <div>Content</div>
        </AppearanceProvider>,
      );

      await waitFor(() => {
        expect(document.documentElement.classList.contains("dark")).toBe(true);
      });
    });

    test("should set appearance style on html element", async () => {
      render(
        <AppearanceProvider appearance="light">
          <div>Content</div>
        </AppearanceProvider>,
      );

      await waitFor(() => {
        expect(document.documentElement.style.colorScheme).toBe("light");
      });
    });

    test("should mirror the preference (not the resolved value) to data-appearance", async () => {
      render(
        <AppearanceProvider appearance="automatic">
          <div>Content</div>
        </AppearanceProvider>,
      );

      // matchMedia mock resolves automatic → light, but data-appearance must keep the *preference*.
      await waitFor(() => {
        expect(document.documentElement.dataset.appearance).toBe("automatic");
      });
      expect(document.documentElement.classList.contains("light")).toBe(true);
    });
  });

  describe("setAppearance", () => {
    test("should call persistAppearance when provided", async () => {
      const user = userEvent.setup();
      const mockPersistAppearance = vi.fn(async (_appearance: Appearance) => {});

      const TestConsumer = (): React.ReactElement => {
        const { setAppearance } = useAppearance();

        return (
          <button
            data-testid="toggle"
            onClick={() => {
              void setAppearance("dark");
            }}
          >
            Toggle
          </button>
        );
      };

      render(
        <AppearanceProvider persistAppearance={mockPersistAppearance} appearance="light">
          <TestConsumer />
        </AppearanceProvider>,
      );

      await user.click(screen.getByTestId("toggle"));

      await waitFor(() => {
        expect(mockPersistAppearance).toHaveBeenCalledWith("dark");
      });
    });

    test("should not call persistAppearance when setting same color scheme", async () => {
      const user = userEvent.setup();
      const mockPersistAppearance = vi.fn(async (_appearance: Appearance) => {});

      const TestConsumer = (): React.ReactElement => {
        const { setAppearance, appearance } = useAppearance();

        return (
          <button
            data-testid="toggle"
            onClick={() => {
              void setAppearance(appearance);
            }}
          >
            Toggle
          </button>
        );
      };

      render(
        <AppearanceProvider persistAppearance={mockPersistAppearance} appearance="dark">
          <TestConsumer />
        </AppearanceProvider>,
      );

      await user.click(screen.getByTestId("toggle"));

      // Wait a bit and verify persistAppearance was not called
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(mockPersistAppearance).not.toHaveBeenCalled();
    });
  });

  describe("SSR", () => {
    test('resolves "automatic" to DEFAULT_COLOR_SCHEME during SSR', () => {
      const TestConsumer = (): React.ReactElement => {
        const { colorScheme } = useAppearance();

        return <span data-testid="resolved">{colorScheme}</span>;
      };

      const html = renderToString(
        <AppearanceProvider appearance="automatic">
          <TestConsumer />
        </AppearanceProvider>,
      );

      expect(html).toContain(DEFAULT_COLOR_SCHEME);
    });
  });

  describe("appearance prop", () => {
    test("defaults to DEFAULT_APPEARANCE when omitted", () => {
      const TestConsumer = (): React.ReactElement => {
        const { appearance } = useAppearance();

        return <span data-testid="appearance-label">{appearance}</span>;
      };

      render(
        <AppearanceProvider>
          <TestConsumer />
        </AppearanceProvider>,
      );

      expect(screen.getByTestId("appearance-label")).toHaveTextContent("automatic");
    });

    test("ignores invalid appearance prop and falls back to DEFAULT_APPEARANCE", () => {
      const TestConsumer = (): React.ReactElement => {
        const { appearance } = useAppearance();

        return <span data-testid="appearance-label">{appearance}</span>;
      };

      render(
        // @ts-expect-error test-only invalid value
        <AppearanceProvider appearance="invalid-value">
          <TestConsumer />
        </AppearanceProvider>,
      );

      expect(screen.getByTestId("appearance-label")).toHaveTextContent("automatic");
    });
  });

  describe("rapid setAppearance (last-write-wins)", () => {
    test("only the last color scheme value is committed when called in rapid succession", async () => {
      const user = userEvent.setup();

      // Slow persist to simulate concurrent in-flight calls
      let resolveFirst: (() => void) | undefined;
      const persistAppearance = vi
        .fn()
        .mockImplementationOnce(
          () =>
            new Promise<void>((resolve) => {
              resolveFirst = resolve;
            }),
        )
        .mockResolvedValue(undefined);

      const TestConsumer = (): React.ReactElement => {
        const { setAppearance, appearance } = useAppearance();

        return (
          <>
            <span data-testid="appearance-label">{appearance}</span>
            <button
              data-testid="go-dark"
              type="button"
              onClick={() => {
                void setAppearance("dark");
              }}
            >
              Dark
            </button>
            <button
              data-testid="go-automatic"
              type="button"
              onClick={() => {
                void setAppearance("automatic");
              }}
            >
              Automatic
            </button>
          </>
        );
      };

      render(
        <AppearanceProvider persistAppearance={persistAppearance} appearance="light">
          <TestConsumer />
        </AppearanceProvider>,
      );

      // Trigger first call (slow persist)
      await user.click(screen.getByTestId("go-dark"));

      // Trigger second call before first persists
      await user.click(screen.getByTestId("go-automatic"));

      // Resolve the slow first persist
      await act(async () => {
        resolveFirst?.();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(persistAppearance).toHaveBeenCalledTimes(2);
      });

      // Final committed state should be the last intent ("automatic"), not "dark"
      expect(screen.getByTestId("appearance-label")).toHaveTextContent("automatic");
    });
  });

  describe("BroadcastChannel", () => {
    const listenersByName = new Map<string, Set<(event: MessageEvent) => void>>();
    const OriginalBroadcastChannel = globalThis.BroadcastChannel;

    beforeAll(() => {
      globalThis.BroadcastChannel = class MockBroadcastChannel {
        readonly name: string;

        constructor(name: string) {
          this.name = name;
        }

        addEventListener(type: string, listener: EventListener): void {
          if (type !== "message") {
            return;
          }
          let set = listenersByName.get(this.name);
          if (!set) {
            set = new Set();
            listenersByName.set(this.name, set);
          }
          set.add(listener as (event: MessageEvent) => void);
        }

        removeEventListener(type: string, listener: EventListener): void {
          if (type !== "message") {
            return;
          }
          listenersByName.get(this.name)?.delete(listener as (event: MessageEvent) => void);
        }

        postMessage(data: unknown): void {
          const set = listenersByName.get(this.name);
          if (!set) {
            return;
          }
          const event = { data } as MessageEvent;
          for (const fn of Array.from(set)) {
            fn(event);
          }
        }

        close(): void {
          /* real BC disconnects this port only; listener cleanup uses removeEventListener */
        }
      } as unknown as typeof BroadcastChannel;
    });

    afterAll(() => {
      globalThis.BroadcastChannel = OriginalBroadcastChannel;
    });

    beforeEach(() => {
      listenersByName.clear();
    });

    test("updates color scheme when another tab posts a different preference", async () => {
      const TestConsumer = (): React.ReactElement => {
        const { appearance } = useAppearance();

        return <span data-testid="appearance-label">{appearance}</span>;
      };

      render(
        <AppearanceProvider appearance="light">
          <TestConsumer />
        </AppearanceProvider>,
      );

      expect(screen.getByTestId("appearance-label")).toHaveTextContent("light");

      const channel = new BroadcastChannel(SYNC_CHANNEL);

      await act(async () => {
        channel.postMessage("dark");
      });

      await waitFor(() => {
        expect(screen.getByTestId("appearance-label")).toHaveTextContent("dark");
      });

      channel.close();
    });

    test("ignores BroadcastChannel message with invalid color scheme value", async () => {
      const TestConsumer = (): React.ReactElement => {
        const { appearance } = useAppearance();

        return <span data-testid="appearance-label">{appearance}</span>;
      };

      render(
        <AppearanceProvider appearance="light">
          <TestConsumer />
        </AppearanceProvider>,
      );

      const channel = new BroadcastChannel(SYNC_CHANNEL);

      await act(async () => {
        // Attempt to inject an invalid value — should be ignored
        channel.postMessage("malicious-payload");
      });

      // State should remain unchanged
      expect(screen.getByTestId("appearance-label")).toHaveTextContent("light");

      channel.close();
    });

    test("ignores BroadcastChannel message when preference matches current", async () => {
      const TestConsumer = (): React.ReactElement => {
        const { appearance } = useAppearance();

        return <span data-testid="appearance-label">{appearance}</span>;
      };

      render(
        <AppearanceProvider appearance="light">
          <TestConsumer />
        </AppearanceProvider>,
      );

      const channel = new BroadcastChannel(SYNC_CHANNEL);

      await act(async () => {
        channel.postMessage("light");
      });

      expect(screen.getByTestId("appearance-label")).toHaveTextContent("light");

      channel.close();
    });
  });

  describe("BroadcastChannel fallback", () => {
    const OriginalBroadcastChannel = globalThis.BroadcastChannel;

    afterEach(() => {
      globalThis.BroadcastChannel = OriginalBroadcastChannel;
    });

    test("does not crash when BroadcastChannel is unavailable", () => {
      // Simulate older browsers/runtime environments without BroadcastChannel.
      // @ts-expect-error test-only override
      globalThis.BroadcastChannel = undefined;

      expect(() => {
        render(
          <AppearanceProvider appearance="light">
            <div data-testid="content">content</div>
          </AppearanceProvider>,
        );
      }).not.toThrow();

      expect(screen.getByTestId("content")).toBeInTheDocument();
    });

    test("does not crash when BroadcastChannel constructor throws", () => {
      globalThis.BroadcastChannel = class BrokenBroadcastChannel {
        constructor(_name: string) {
          throw new Error("constructor blocked");
        }
      } as unknown as typeof BroadcastChannel;

      expect(() => {
        render(
          <AppearanceProvider appearance="dark">
            <div data-testid="content">content</div>
          </AppearanceProvider>,
        );
      }).not.toThrow();

      expect(screen.getByTestId("content")).toBeInTheDocument();
    });
  });

  describe("setAppearance errors", () => {
    test("logs and keeps prior color scheme when persistAppearance rejects", async () => {
      const user = userEvent.setup();
      const persistAppearance = vi.fn(async (_appearance: Appearance) => {
        throw new Error("persist failed");
      });
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const TestConsumer = (): React.ReactElement => {
        const { setAppearance, appearance } = useAppearance();

        return (
          <>
            <span data-testid="appearance-label">{appearance}</span>
            <button
              data-testid="go-dark"
              type="button"
              onClick={() => {
                void setAppearance("dark");
              }}
            >
              Dark
            </button>
          </>
        );
      };

      render(
        <AppearanceProvider persistAppearance={persistAppearance} appearance="light">
          <TestConsumer />
        </AppearanceProvider>,
      );

      await user.click(screen.getByTestId("go-dark"));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      expect(screen.getByTestId("appearance-label")).toHaveTextContent("light");

      consoleSpy.mockRestore();
    });

    test("calls onPersistError with error and attempted color scheme", async () => {
      const user = userEvent.setup();
      const persistError = new Error("persist failed");
      const persistAppearance = vi.fn(async (_appearance: Appearance) => {
        throw persistError;
      });
      const onPersistError = vi.fn();

      const TestConsumer = (): React.ReactElement => {
        const { setAppearance, appearance } = useAppearance();

        return (
          <>
            <span data-testid="appearance-label">{appearance}</span>
            <button
              data-testid="go-dark"
              type="button"
              onClick={() => {
                void setAppearance("dark");
              }}
            >
              Dark
            </button>
          </>
        );
      };

      render(
        <AppearanceProvider onPersistError={onPersistError} persistAppearance={persistAppearance} appearance="light">
          <TestConsumer />
        </AppearanceProvider>,
      );

      await user.click(screen.getByTestId("go-dark"));

      await waitFor(() => {
        expect(onPersistError).toHaveBeenCalledWith(persistError, "dark");
      });

      expect(screen.getByTestId("appearance-label")).toHaveTextContent("light");
    });
  });

  describe("storageKey (client-only localStorage)", () => {
    beforeEach(() => {
      window.localStorage.clear();
    });

    afterEach(() => {
      window.localStorage.clear();
    });

    test("restores the persisted preference from the initial render", () => {
      window.localStorage.setItem("ui-theme", "dark");

      const TestConsumer = (): React.ReactElement => {
        const { appearance } = useAppearance();

        return <span data-testid="appearance-label">{appearance}</span>;
      };

      render(
        <AppearanceProvider appearance="automatic" storageKey="ui-theme">
          <TestConsumer />
        </AppearanceProvider>,
      );

      // No waitFor: the initializer reads localStorage synchronously, so the very first render is "dark".
      expect(screen.getByTestId("appearance-label")).toHaveTextContent("dark");
    });

    test("defaults storageKey to STORAGE_KEY when omitted", async () => {
      const user = userEvent.setup();

      const TestConsumer = (): React.ReactElement => {
        const { setAppearance } = useAppearance();

        return (
          <button
            data-testid="toggle"
            type="button"
            onClick={() => {
              void setAppearance("dark");
            }}
          >
            Toggle
          </button>
        );
      };

      render(
        <AppearanceProvider appearance="light">
          <TestConsumer />
        </AppearanceProvider>,
      );

      await user.click(screen.getByTestId("toggle"));

      await waitFor(() => {
        expect(window.localStorage.getItem(STORAGE_KEY)).toBe("dark");
      });
    });

    test("auto-persists changes to localStorage when no persistAppearance is given", async () => {
      const user = userEvent.setup();

      const TestConsumer = (): React.ReactElement => {
        const { setAppearance } = useAppearance();

        return (
          <button
            data-testid="toggle"
            type="button"
            onClick={() => {
              void setAppearance("dark");
            }}
          >
            Toggle
          </button>
        );
      };

      render(
        <AppearanceProvider appearance="light" storageKey="ui-theme">
          <TestConsumer />
        </AppearanceProvider>,
      );

      await user.click(screen.getByTestId("toggle"));

      await waitFor(() => {
        expect(window.localStorage.getItem("ui-theme")).toBe("dark");
      });
    });

    test("explicit persistAppearance wins over the localStorage auto-persist", async () => {
      const user = userEvent.setup();
      const persistAppearance = vi.fn(async (_value: Appearance) => {});

      const TestConsumer = (): React.ReactElement => {
        const { setAppearance } = useAppearance();

        return (
          <button
            data-testid="toggle"
            type="button"
            onClick={() => {
              void setAppearance("dark");
            }}
          >
            Toggle
          </button>
        );
      };

      render(
        <AppearanceProvider appearance="light" persistAppearance={persistAppearance} storageKey="ui-theme">
          <TestConsumer />
        </AppearanceProvider>,
      );

      await user.click(screen.getByTestId("toggle"));

      await waitFor(() => {
        expect(persistAppearance).toHaveBeenCalledWith("dark");
      });

      expect(window.localStorage.getItem("ui-theme")).toBeNull();
    });

    test("applies the stored preference from the initializer, never flashing through the prop", async () => {
      window.localStorage.setItem("ui-theme", "dark");

      // matchMedia=light + prop="light": neither resolves to dark, so a "dark" class can only come from the
      // initializer reading localStorage — proving the first (and only) applyAppearance used the stored value.
      render(
        <AppearanceProvider appearance="light" storageKey="ui-theme">
          <div>Content</div>
        </AppearanceProvider>,
      );

      await waitFor(() => {
        expect(document.documentElement.classList.contains("dark")).toBe(true);
      });

      expect(document.documentElement.classList.contains("light")).toBe(false);
    });

    test("syncs across tabs via the storage event", async () => {
      const TestConsumer = (): React.ReactElement => {
        const { appearance } = useAppearance();

        return <span data-testid="appearance-label">{appearance}</span>;
      };

      render(
        <AppearanceProvider appearance="light" storageKey="ui-theme">
          <TestConsumer />
        </AppearanceProvider>,
      );

      expect(screen.getByTestId("appearance-label")).toHaveTextContent("light");

      await act(async () => {
        dispatchStorageEvent("ui-theme", "dark");
      });

      await waitFor(() => {
        expect(screen.getByTestId("appearance-label")).toHaveTextContent("dark");
      });
    });

    test("ignores storage events for other keys or invalid values", async () => {
      const TestConsumer = (): React.ReactElement => {
        const { appearance } = useAppearance();

        return <span data-testid="appearance-label">{appearance}</span>;
      };

      render(
        <AppearanceProvider appearance="light" storageKey="ui-theme">
          <TestConsumer />
        </AppearanceProvider>,
      );

      await act(async () => {
        dispatchStorageEvent("other-key", "dark");
        dispatchStorageEvent("ui-theme", "not-a-scheme");
      });

      expect(screen.getByTestId("appearance-label")).toHaveTextContent("light");
    });
  });
});
