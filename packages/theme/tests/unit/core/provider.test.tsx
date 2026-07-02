import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import { renderToString } from "react-dom/server";

import { DEFAULT_RESOLVED_COLOR_SCHEME, STORAGE_KEY, SYNC_CHANNEL } from "#/constants";
import { AppearanceProvider } from "#/core/provider";
import { useColorScheme } from "#/core/use-theme";
import { createMockMediaQueryList, mockMatchMedia } from "#/tests/support/mocks";
import type { ColorScheme } from "#/types";

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
        <AppearanceProvider colorScheme="light">
          <div data-testid="child">Child Content</div>
        </AppearanceProvider>,
      );

      expect(screen.getByTestId("child")).toHaveTextContent("Child Content");
    });

    test("should render multiple children", () => {
      render(
        <AppearanceProvider colorScheme="dark">
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
        const { colorScheme } = useColorScheme();

        return <span data-testid="colorScheme">{colorScheme}</span>;
      };

      render(
        <AppearanceProvider colorScheme="dark">
          <TestConsumer />
        </AppearanceProvider>,
      );

      expect(screen.getByTestId("colorScheme")).toHaveTextContent("dark");
    });

    test("should provide resolved color scheme for explicit schemes", () => {
      const TestConsumer = (): React.ReactElement => {
        const { resolvedColorScheme } = useColorScheme();

        return <span data-testid="resolved">{resolvedColorScheme}</span>;
      };

      render(
        <AppearanceProvider colorScheme="light">
          <TestConsumer />
        </AppearanceProvider>,
      );

      expect(screen.getByTestId("resolved")).toHaveTextContent("light");
    });

    test('should resolve "automatic" color scheme to OS preference (light)', () => {
      mockMatchMedia(() => createMockMediaQueryList(false, ""));

      const TestConsumer = (): React.ReactElement => {
        const { resolvedColorScheme, colorScheme } = useColorScheme();

        return (
          <>
            <span data-testid="colorScheme">{colorScheme}</span>
            <span data-testid="resolved">{resolvedColorScheme}</span>
          </>
        );
      };

      render(
        <AppearanceProvider colorScheme="automatic">
          <TestConsumer />
        </AppearanceProvider>,
      );

      expect(screen.getByTestId("colorScheme")).toHaveTextContent("automatic");
      expect(screen.getByTestId("resolved")).toHaveTextContent("light");
    });

    test('should resolve "automatic" color scheme to OS preference (dark)', () => {
      mockMatchMedia((query) => createMockMediaQueryList(query === "(prefers-color-scheme: dark)", query));

      const TestConsumer = (): React.ReactElement => {
        const { resolvedColorScheme } = useColorScheme();

        return <span data-testid="resolved">{resolvedColorScheme}</span>;
      };

      render(
        <AppearanceProvider colorScheme="automatic">
          <TestConsumer />
        </AppearanceProvider>,
      );

      expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
    });

    test("should provide isPending as false initially", () => {
      const TestConsumer = (): React.ReactElement => {
        const { isPending } = useColorScheme();

        return <span data-testid="pending">{String(isPending)}</span>;
      };

      render(
        <AppearanceProvider colorScheme="dark">
          <TestConsumer />
        </AppearanceProvider>,
      );

      expect(screen.getByTestId("pending")).toHaveTextContent("false");
    });

    test("should provide setColorScheme function", () => {
      const TestConsumer = (): React.ReactElement => {
        const { setColorScheme } = useColorScheme();

        return <span data-testid="hasSetColorScheme">{typeof setColorScheme}</span>;
      };

      render(
        <AppearanceProvider colorScheme="dark">
          <TestConsumer />
        </AppearanceProvider>,
      );

      expect(screen.getByTestId("hasSetColorScheme")).toHaveTextContent("function");
    });
  });

  describe("DOM updates", () => {
    test("should apply color scheme class to html element on mount", async () => {
      render(
        <AppearanceProvider colorScheme="dark">
          <div>Content</div>
        </AppearanceProvider>,
      );

      await waitFor(() => {
        expect(document.documentElement.classList.contains("dark")).toBe(true);
      });
    });

    test("should set colorScheme style on html element", async () => {
      render(
        <AppearanceProvider colorScheme="light">
          <div>Content</div>
        </AppearanceProvider>,
      );

      await waitFor(() => {
        expect(document.documentElement.style.colorScheme).toBe("light");
      });
    });

    test("should mirror the preference (not the resolved value) to data-appearance", async () => {
      render(
        <AppearanceProvider colorScheme="automatic">
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

  describe("setColorScheme", () => {
    test("should call persistColorScheme when provided", async () => {
      const user = userEvent.setup();
      const mockPersistColorScheme = vi.fn(async (_colorScheme: ColorScheme) => {});

      const TestConsumer = (): React.ReactElement => {
        const { setColorScheme } = useColorScheme();

        return (
          <button
            data-testid="toggle"
            onClick={() => {
              void setColorScheme("dark");
            }}
          >
            Toggle
          </button>
        );
      };

      render(
        <AppearanceProvider persistColorScheme={mockPersistColorScheme} colorScheme="light">
          <TestConsumer />
        </AppearanceProvider>,
      );

      await user.click(screen.getByTestId("toggle"));

      await waitFor(() => {
        expect(mockPersistColorScheme).toHaveBeenCalledWith("dark");
      });
    });

    test("should not call persistColorScheme when setting same color scheme", async () => {
      const user = userEvent.setup();
      const mockPersistColorScheme = vi.fn(async (_colorScheme: ColorScheme) => {});

      const TestConsumer = (): React.ReactElement => {
        const { setColorScheme, colorScheme } = useColorScheme();

        return (
          <button
            data-testid="toggle"
            onClick={() => {
              void setColorScheme(colorScheme);
            }}
          >
            Toggle
          </button>
        );
      };

      render(
        <AppearanceProvider persistColorScheme={mockPersistColorScheme} colorScheme="dark">
          <TestConsumer />
        </AppearanceProvider>,
      );

      await user.click(screen.getByTestId("toggle"));

      // Wait a bit and verify persistColorScheme was not called
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(mockPersistColorScheme).not.toHaveBeenCalled();
    });
  });

  describe("SSR", () => {
    test('resolves "automatic" to DEFAULT_RESOLVED_COLOR_SCHEME during SSR', () => {
      const TestConsumer = (): React.ReactElement => {
        const { resolvedColorScheme } = useColorScheme();

        return <span data-testid="resolved">{resolvedColorScheme}</span>;
      };

      const html = renderToString(
        <AppearanceProvider colorScheme="automatic">
          <TestConsumer />
        </AppearanceProvider>,
      );

      expect(html).toContain(DEFAULT_RESOLVED_COLOR_SCHEME);
    });
  });

  describe("colorScheme prop", () => {
    test("defaults to DEFAULT_COLOR_SCHEME when omitted", () => {
      const TestConsumer = (): React.ReactElement => {
        const { colorScheme } = useColorScheme();

        return <span data-testid="colorScheme-label">{colorScheme}</span>;
      };

      render(
        <AppearanceProvider>
          <TestConsumer />
        </AppearanceProvider>,
      );

      expect(screen.getByTestId("colorScheme-label")).toHaveTextContent("automatic");
    });

    test("ignores invalid colorScheme prop and falls back to DEFAULT_COLOR_SCHEME", () => {
      const TestConsumer = (): React.ReactElement => {
        const { colorScheme } = useColorScheme();

        return <span data-testid="colorScheme-label">{colorScheme}</span>;
      };

      render(
        // @ts-expect-error test-only invalid value
        <AppearanceProvider colorScheme="invalid-value">
          <TestConsumer />
        </AppearanceProvider>,
      );

      expect(screen.getByTestId("colorScheme-label")).toHaveTextContent("automatic");
    });
  });

  describe("rapid setColorScheme (last-write-wins)", () => {
    test("only the last color scheme value is committed when called in rapid succession", async () => {
      const user = userEvent.setup();

      // Slow persist to simulate concurrent in-flight calls
      let resolveFirst: (() => void) | undefined;
      const persistColorScheme = vi
        .fn()
        .mockImplementationOnce(
          () =>
            new Promise<void>((resolve) => {
              resolveFirst = resolve;
            }),
        )
        .mockResolvedValue(undefined);

      const TestConsumer = (): React.ReactElement => {
        const { setColorScheme, colorScheme } = useColorScheme();

        return (
          <>
            <span data-testid="colorScheme-label">{colorScheme}</span>
            <button
              data-testid="go-dark"
              type="button"
              onClick={() => {
                void setColorScheme("dark");
              }}
            >
              Dark
            </button>
            <button
              data-testid="go-automatic"
              type="button"
              onClick={() => {
                void setColorScheme("automatic");
              }}
            >
              Automatic
            </button>
          </>
        );
      };

      render(
        <AppearanceProvider persistColorScheme={persistColorScheme} colorScheme="light">
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
        expect(persistColorScheme).toHaveBeenCalledTimes(2);
      });

      // Final committed state should be the last intent ("automatic"), not "dark"
      expect(screen.getByTestId("colorScheme-label")).toHaveTextContent("automatic");
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
        const { colorScheme } = useColorScheme();

        return <span data-testid="colorScheme-label">{colorScheme}</span>;
      };

      render(
        <AppearanceProvider colorScheme="light">
          <TestConsumer />
        </AppearanceProvider>,
      );

      expect(screen.getByTestId("colorScheme-label")).toHaveTextContent("light");

      const channel = new BroadcastChannel(SYNC_CHANNEL);

      await act(async () => {
        channel.postMessage("dark");
      });

      await waitFor(() => {
        expect(screen.getByTestId("colorScheme-label")).toHaveTextContent("dark");
      });

      channel.close();
    });

    test("ignores BroadcastChannel message with invalid color scheme value", async () => {
      const TestConsumer = (): React.ReactElement => {
        const { colorScheme } = useColorScheme();

        return <span data-testid="colorScheme-label">{colorScheme}</span>;
      };

      render(
        <AppearanceProvider colorScheme="light">
          <TestConsumer />
        </AppearanceProvider>,
      );

      const channel = new BroadcastChannel(SYNC_CHANNEL);

      await act(async () => {
        // Attempt to inject an invalid value — should be ignored
        channel.postMessage("malicious-payload");
      });

      // State should remain unchanged
      expect(screen.getByTestId("colorScheme-label")).toHaveTextContent("light");

      channel.close();
    });

    test("ignores BroadcastChannel message when preference matches current", async () => {
      const TestConsumer = (): React.ReactElement => {
        const { colorScheme } = useColorScheme();

        return <span data-testid="colorScheme-label">{colorScheme}</span>;
      };

      render(
        <AppearanceProvider colorScheme="light">
          <TestConsumer />
        </AppearanceProvider>,
      );

      const channel = new BroadcastChannel(SYNC_CHANNEL);

      await act(async () => {
        channel.postMessage("light");
      });

      expect(screen.getByTestId("colorScheme-label")).toHaveTextContent("light");

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
          <AppearanceProvider colorScheme="light">
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
          <AppearanceProvider colorScheme="dark">
            <div data-testid="content">content</div>
          </AppearanceProvider>,
        );
      }).not.toThrow();

      expect(screen.getByTestId("content")).toBeInTheDocument();
    });
  });

  describe("setColorScheme errors", () => {
    test("logs and keeps prior color scheme when persistColorScheme rejects", async () => {
      const user = userEvent.setup();
      const persistColorScheme = vi.fn(async (_colorScheme: ColorScheme) => {
        throw new Error("persist failed");
      });
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const TestConsumer = (): React.ReactElement => {
        const { setColorScheme, colorScheme } = useColorScheme();

        return (
          <>
            <span data-testid="colorScheme-label">{colorScheme}</span>
            <button
              data-testid="go-dark"
              type="button"
              onClick={() => {
                void setColorScheme("dark");
              }}
            >
              Dark
            </button>
          </>
        );
      };

      render(
        <AppearanceProvider persistColorScheme={persistColorScheme} colorScheme="light">
          <TestConsumer />
        </AppearanceProvider>,
      );

      await user.click(screen.getByTestId("go-dark"));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      expect(screen.getByTestId("colorScheme-label")).toHaveTextContent("light");

      consoleSpy.mockRestore();
    });

    test("calls onPersistError with error and attempted color scheme", async () => {
      const user = userEvent.setup();
      const persistError = new Error("persist failed");
      const persistColorScheme = vi.fn(async (_colorScheme: ColorScheme) => {
        throw persistError;
      });
      const onPersistError = vi.fn();

      const TestConsumer = (): React.ReactElement => {
        const { setColorScheme, colorScheme } = useColorScheme();

        return (
          <>
            <span data-testid="colorScheme-label">{colorScheme}</span>
            <button
              data-testid="go-dark"
              type="button"
              onClick={() => {
                void setColorScheme("dark");
              }}
            >
              Dark
            </button>
          </>
        );
      };

      render(
        <AppearanceProvider onPersistError={onPersistError} persistColorScheme={persistColorScheme} colorScheme="light">
          <TestConsumer />
        </AppearanceProvider>,
      );

      await user.click(screen.getByTestId("go-dark"));

      await waitFor(() => {
        expect(onPersistError).toHaveBeenCalledWith(persistError, "dark");
      });

      expect(screen.getByTestId("colorScheme-label")).toHaveTextContent("light");
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
        const { colorScheme } = useColorScheme();

        return <span data-testid="colorScheme-label">{colorScheme}</span>;
      };

      render(
        <AppearanceProvider colorScheme="automatic" storageKey="ui-theme">
          <TestConsumer />
        </AppearanceProvider>,
      );

      // No waitFor: the initializer reads localStorage synchronously, so the very first render is "dark".
      expect(screen.getByTestId("colorScheme-label")).toHaveTextContent("dark");
    });

    test("defaults storageKey to STORAGE_KEY when omitted", async () => {
      const user = userEvent.setup();

      const TestConsumer = (): React.ReactElement => {
        const { setColorScheme } = useColorScheme();

        return (
          <button
            data-testid="toggle"
            type="button"
            onClick={() => {
              void setColorScheme("dark");
            }}
          >
            Toggle
          </button>
        );
      };

      render(
        <AppearanceProvider colorScheme="light">
          <TestConsumer />
        </AppearanceProvider>,
      );

      await user.click(screen.getByTestId("toggle"));

      await waitFor(() => {
        expect(window.localStorage.getItem(STORAGE_KEY)).toBe("dark");
      });
    });

    test("auto-persists changes to localStorage when no persistColorScheme is given", async () => {
      const user = userEvent.setup();

      const TestConsumer = (): React.ReactElement => {
        const { setColorScheme } = useColorScheme();

        return (
          <button
            data-testid="toggle"
            type="button"
            onClick={() => {
              void setColorScheme("dark");
            }}
          >
            Toggle
          </button>
        );
      };

      render(
        <AppearanceProvider colorScheme="light" storageKey="ui-theme">
          <TestConsumer />
        </AppearanceProvider>,
      );

      await user.click(screen.getByTestId("toggle"));

      await waitFor(() => {
        expect(window.localStorage.getItem("ui-theme")).toBe("dark");
      });
    });

    test("explicit persistColorScheme wins over the localStorage auto-persist", async () => {
      const user = userEvent.setup();
      const persistColorScheme = vi.fn(async (_value: ColorScheme) => {});

      const TestConsumer = (): React.ReactElement => {
        const { setColorScheme } = useColorScheme();

        return (
          <button
            data-testid="toggle"
            type="button"
            onClick={() => {
              void setColorScheme("dark");
            }}
          >
            Toggle
          </button>
        );
      };

      render(
        <AppearanceProvider colorScheme="light" persistColorScheme={persistColorScheme} storageKey="ui-theme">
          <TestConsumer />
        </AppearanceProvider>,
      );

      await user.click(screen.getByTestId("toggle"));

      await waitFor(() => {
        expect(persistColorScheme).toHaveBeenCalledWith("dark");
      });

      expect(window.localStorage.getItem("ui-theme")).toBeNull();
    });

    test("applies the stored preference from the initializer, never flashing through the prop", async () => {
      window.localStorage.setItem("ui-theme", "dark");

      // matchMedia=light + prop="light": neither resolves to dark, so a "dark" class can only come from the
      // initializer reading localStorage — proving the first (and only) applyColorScheme used the stored value.
      render(
        <AppearanceProvider colorScheme="light" storageKey="ui-theme">
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
        const { colorScheme } = useColorScheme();

        return <span data-testid="colorScheme-label">{colorScheme}</span>;
      };

      render(
        <AppearanceProvider colorScheme="light" storageKey="ui-theme">
          <TestConsumer />
        </AppearanceProvider>,
      );

      expect(screen.getByTestId("colorScheme-label")).toHaveTextContent("light");

      await act(async () => {
        dispatchStorageEvent("ui-theme", "dark");
      });

      await waitFor(() => {
        expect(screen.getByTestId("colorScheme-label")).toHaveTextContent("dark");
      });
    });

    test("ignores storage events for other keys or invalid values", async () => {
      const TestConsumer = (): React.ReactElement => {
        const { colorScheme } = useColorScheme();

        return <span data-testid="colorScheme-label">{colorScheme}</span>;
      };

      render(
        <AppearanceProvider colorScheme="light" storageKey="ui-theme">
          <TestConsumer />
        </AppearanceProvider>,
      );

      await act(async () => {
        dispatchStorageEvent("other-key", "dark");
        dispatchStorageEvent("ui-theme", "not-a-scheme");
      });

      expect(screen.getByTestId("colorScheme-label")).toHaveTextContent("light");
    });
  });
});
