import type React from "react";

import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";

import { ThemeProvider } from "#/core/provider";
import { useTheme } from "#/core/use-theme";
import { THEME_CHANNEL } from "#/constants";
import type { Theme } from "#/types";
import { createMockMediaQueryList, mockMatchMedia } from "#/tests/support/mocks";

describe("ThemeProvider", () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    // Reset document state
    document.documentElement.className = "";
    document.documentElement.style.colorScheme = "";

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
        <ThemeProvider theme="light">
          <div data-testid="child">Child Content</div>
        </ThemeProvider>,
      );

      expect(screen.getByTestId("child")).toHaveTextContent("Child Content");
    });

    test("should render multiple children", () => {
      render(
        <ThemeProvider theme="dark">
          <div data-testid="child1">Child 1</div>
          <div data-testid="child2">Child 2</div>
        </ThemeProvider>,
      );

      expect(screen.getByTestId("child1")).toBeInTheDocument();
      expect(screen.getByTestId("child2")).toBeInTheDocument();
    });
  });

  describe("theme context", () => {
    test("should provide initial theme via context", () => {
      const TestConsumer = (): React.ReactElement => {
        const { theme } = useTheme();

        return <span data-testid="theme">{theme}</span>;
      };

      render(
        <ThemeProvider theme="dark">
          <TestConsumer />
        </ThemeProvider>,
      );

      expect(screen.getByTestId("theme")).toHaveTextContent("dark");
    });

    test("should provide resolved theme for explicit themes", () => {
      const TestConsumer = (): React.ReactElement => {
        const { resolvedTheme } = useTheme();

        return <span data-testid="resolved">{resolvedTheme}</span>;
      };

      render(
        <ThemeProvider theme="light">
          <TestConsumer />
        </ThemeProvider>,
      );

      expect(screen.getByTestId("resolved")).toHaveTextContent("light");
    });

    test('should resolve "system" theme to OS preference (light)', () => {
      mockMatchMedia(() => createMockMediaQueryList(false, ""));

      const TestConsumer = (): React.ReactElement => {
        const { resolvedTheme, theme } = useTheme();

        return (
          <>
            <span data-testid="theme">{theme}</span>
            <span data-testid="resolved">{resolvedTheme}</span>
          </>
        );
      };

      render(
        <ThemeProvider theme="system">
          <TestConsumer />
        </ThemeProvider>,
      );

      expect(screen.getByTestId("theme")).toHaveTextContent("system");
      expect(screen.getByTestId("resolved")).toHaveTextContent("light");
    });

    test('should resolve "system" theme to OS preference (dark)', () => {
      mockMatchMedia((query) =>
        createMockMediaQueryList(query === "(prefers-color-scheme: dark)", query),
      );

      const TestConsumer = (): React.ReactElement => {
        const { resolvedTheme } = useTheme();

        return <span data-testid="resolved">{resolvedTheme}</span>;
      };

      render(
        <ThemeProvider theme="system">
          <TestConsumer />
        </ThemeProvider>,
      );

      expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
    });

    test("should provide isPending as false initially", () => {
      const TestConsumer = (): React.ReactElement => {
        const { isPending } = useTheme();

        return <span data-testid="pending">{String(isPending)}</span>;
      };

      render(
        <ThemeProvider theme="dark">
          <TestConsumer />
        </ThemeProvider>,
      );

      expect(screen.getByTestId("pending")).toHaveTextContent("false");
    });

    test("should provide setTheme function", () => {
      const TestConsumer = (): React.ReactElement => {
        const { setTheme } = useTheme();

        return <span data-testid="hasSetTheme">{typeof setTheme}</span>;
      };

      render(
        <ThemeProvider theme="dark">
          <TestConsumer />
        </ThemeProvider>,
      );

      expect(screen.getByTestId("hasSetTheme")).toHaveTextContent("function");
    });
  });

  describe("DOM updates", () => {
    test("should apply theme class to html element on mount", async () => {
      render(
        <ThemeProvider theme="dark">
          <div>Content</div>
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(document.documentElement.classList.contains("dark")).toBe(true);
      });
    });

    test("should set colorScheme style on html element", async () => {
      render(
        <ThemeProvider theme="light">
          <div>Content</div>
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(document.documentElement.style.colorScheme).toBe("light");
      });
    });
  });

  describe("setTheme", () => {
    test("should call persistTheme when provided", async () => {
      const user = userEvent.setup();
      const mockPersistTheme = vi.fn(async (_theme: Theme) => {});

      const TestConsumer = (): React.ReactElement => {
        const { setTheme } = useTheme();

        return (
          <button
            data-testid="toggle"
            onClick={() => {
              void setTheme("dark");
            }}
          >
            Toggle
          </button>
        );
      };

      render(
        <ThemeProvider persistTheme={mockPersistTheme} theme="light">
          <TestConsumer />
        </ThemeProvider>,
      );

      await user.click(screen.getByTestId("toggle"));

      await waitFor(() => {
        expect(mockPersistTheme).toHaveBeenCalledWith("dark");
      });
    });

    test("should not call persistTheme when setting same theme", async () => {
      const user = userEvent.setup();
      const mockPersistTheme = vi.fn(async (_theme: Theme) => {});

      const TestConsumer = (): React.ReactElement => {
        const { setTheme, theme } = useTheme();

        return (
          <button
            data-testid="toggle"
            onClick={() => {
              void setTheme(theme);
            }}
          >
            Toggle
          </button>
        );
      };

      render(
        <ThemeProvider persistTheme={mockPersistTheme} theme="dark">
          <TestConsumer />
        </ThemeProvider>,
      );

      await user.click(screen.getByTestId("toggle"));

      // Wait a bit and verify persistTheme was not called
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(mockPersistTheme).not.toHaveBeenCalled();
    });
  });

  describe("syncThemeFromServer", () => {
    test("reconciles state when server returns a different theme after mount", async () => {
      const sync = vi.fn().mockResolvedValue("dark" as Theme);

      const TestConsumer = (): React.ReactElement => {
        const { theme } = useTheme();

        return <span data-testid="theme-label">{theme}</span>;
      };

      render(
        <ThemeProvider syncThemeFromServer={sync} theme="light">
          <TestConsumer />
        </ThemeProvider>,
      );

      expect(screen.getByTestId("theme-label")).toHaveTextContent("light");

      await waitFor(() => {
        expect(screen.getByTestId("theme-label")).toHaveTextContent("dark");
      });

      expect(sync).toHaveBeenCalledTimes(1);
    });

    test("keeps initial theme when syncThemeFromServer rejects", async () => {
      const sync = vi.fn().mockRejectedValue(new Error("network"));

      const TestConsumer = (): React.ReactElement => {
        const { theme } = useTheme();

        return <span data-testid="theme-label">{theme}</span>;
      };

      render(
        <ThemeProvider syncThemeFromServer={sync} theme="light">
          <TestConsumer />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(sync).toHaveBeenCalled();
      });

      expect(screen.getByTestId("theme-label")).toHaveTextContent("light");
    });

    test("does not change preference when server returns the same theme", async () => {
      const sync = vi.fn().mockResolvedValue("light" as Theme);

      const TestConsumer = (): React.ReactElement => {
        const { theme } = useTheme();

        return <span data-testid="theme-label">{theme}</span>;
      };

      render(
        <ThemeProvider syncThemeFromServer={sync} theme="light">
          <TestConsumer />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(sync).toHaveBeenCalled();
      });

      expect(screen.getByTestId("theme-label")).toHaveTextContent("light");
    });

    test("ignores server result after unmount", async () => {
      let resolveSync: ((value: Theme) => void) | undefined;
      const sync = vi.fn(
        () =>
          new Promise<Theme>((resolve) => {
            resolveSync = resolve;
          }),
      );

      const { unmount } = render(
        <ThemeProvider syncThemeFromServer={sync} theme="light">
          <span data-testid="x">x</span>
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(sync).toHaveBeenCalled();
      });

      unmount();

      await act(async () => {
        if (resolveSync === undefined) {
          throw new Error("expected syncThemeFromServer to have started");
        }
        resolveSync("dark");
        await Promise.resolve();
      });
    });
  });

  describe("ssrSystemTheme", () => {
    test("uses ssrSystemTheme as resolved system preference during SSR", () => {
      const TestConsumer = (): React.ReactElement => {
        const { resolvedTheme } = useTheme();

        return <span data-testid="resolved">{resolvedTheme}</span>;
      };

      const html = renderToString(
        <ThemeProvider ssrSystemTheme="light" theme="system">
          <TestConsumer />
        </ThemeProvider>,
      );

      expect(html).toContain("light");
    });
  });

  describe("theme prop sync after mount", () => {
    test("re-syncs state when theme prop changes (e.g. loader re-runs)", async () => {
      const TestConsumer = (): React.ReactElement => {
        const { theme } = useTheme();

        return <span data-testid="theme-label">{theme}</span>;
      };

      const { rerender } = render(
        <ThemeProvider theme="light">
          <TestConsumer />
        </ThemeProvider>,
      );

      expect(screen.getByTestId("theme-label")).toHaveTextContent("light");

      rerender(
        <ThemeProvider theme="dark">
          <TestConsumer />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("theme-label")).toHaveTextContent("dark");
      });
    });

    test("ignores invalid theme prop and falls back to DEFAULT_THEME", () => {
      const TestConsumer = (): React.ReactElement => {
        const { theme } = useTheme();

        return <span data-testid="theme-label">{theme}</span>;
      };

      render(
        // @ts-expect-error test-only invalid value
        <ThemeProvider theme="invalid-value">
          <TestConsumer />
        </ThemeProvider>,
      );

      expect(screen.getByTestId("theme-label")).toHaveTextContent("system");
    });
  });

  describe("rapid setTheme (last-write-wins)", () => {
    test("only the last theme value is committed when called in rapid succession", async () => {
      const user = userEvent.setup();

      // Slow persist to simulate concurrent in-flight calls
      let resolveFirst: (() => void) | undefined;
      const persistTheme = vi
        .fn()
        .mockImplementationOnce(
          () =>
            new Promise<void>((resolve) => {
              resolveFirst = resolve;
            }),
        )
        .mockResolvedValue(undefined);

      const TestConsumer = (): React.ReactElement => {
        const { setTheme, theme } = useTheme();

        return (
          <>
            <span data-testid="theme-label">{theme}</span>
            <button
              data-testid="go-dark"
              type="button"
              onClick={() => {
                void setTheme("dark");
              }}
            >
              Dark
            </button>
            <button
              data-testid="go-system"
              type="button"
              onClick={() => {
                void setTheme("system");
              }}
            >
              System
            </button>
          </>
        );
      };

      render(
        <ThemeProvider persistTheme={persistTheme} theme="light">
          <TestConsumer />
        </ThemeProvider>,
      );

      // Trigger first call (slow persist)
      await user.click(screen.getByTestId("go-dark"));

      // Trigger second call before first persists
      await user.click(screen.getByTestId("go-system"));

      // Resolve the slow first persist
      await act(async () => {
        resolveFirst?.();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(persistTheme).toHaveBeenCalledTimes(2);
      });

      // Final committed state should be the last intent ("system"), not "dark"
      expect(screen.getByTestId("theme-label")).toHaveTextContent("system");
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
          for (const fn of [...set]) {
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

    test("updates theme when another tab posts a different preference", async () => {
      const TestConsumer = (): React.ReactElement => {
        const { theme } = useTheme();

        return <span data-testid="theme-label">{theme}</span>;
      };

      render(
        <ThemeProvider theme="light">
          <TestConsumer />
        </ThemeProvider>,
      );

      expect(screen.getByTestId("theme-label")).toHaveTextContent("light");

      const channel = new BroadcastChannel(THEME_CHANNEL);

      await act(async () => {
        channel.postMessage("dark");
      });

      await waitFor(() => {
        expect(screen.getByTestId("theme-label")).toHaveTextContent("dark");
      });

      channel.close();
    });

    test("ignores BroadcastChannel message with invalid theme value", async () => {
      const TestConsumer = (): React.ReactElement => {
        const { theme } = useTheme();

        return <span data-testid="theme-label">{theme}</span>;
      };

      render(
        <ThemeProvider theme="light">
          <TestConsumer />
        </ThemeProvider>,
      );

      const channel = new BroadcastChannel(THEME_CHANNEL);

      await act(async () => {
        // Attempt to inject an invalid value — should be ignored
        channel.postMessage("malicious-payload");
      });

      // State should remain unchanged
      expect(screen.getByTestId("theme-label")).toHaveTextContent("light");

      channel.close();
    });

    test("ignores BroadcastChannel message when preference matches current", async () => {
      const TestConsumer = (): React.ReactElement => {
        const { theme } = useTheme();

        return <span data-testid="theme-label">{theme}</span>;
      };

      render(
        <ThemeProvider theme="light">
          <TestConsumer />
        </ThemeProvider>,
      );

      const channel = new BroadcastChannel(THEME_CHANNEL);

      await act(async () => {
        channel.postMessage("light");
      });

      expect(screen.getByTestId("theme-label")).toHaveTextContent("light");

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
          <ThemeProvider theme="light">
            <div data-testid="content">content</div>
          </ThemeProvider>,
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
          <ThemeProvider theme="dark">
            <div data-testid="content">content</div>
          </ThemeProvider>,
        );
      }).not.toThrow();

      expect(screen.getByTestId("content")).toBeInTheDocument();
    });
  });

  describe("setTheme errors", () => {
    test("logs and keeps prior theme when persistTheme rejects", async () => {
      const user = userEvent.setup();
      const persistTheme = vi.fn(async (_theme: Theme) => {
        throw new Error("persist failed");
      });
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const TestConsumer = (): React.ReactElement => {
        const { setTheme, theme } = useTheme();

        return (
          <>
            <span data-testid="theme-label">{theme}</span>
            <button
              data-testid="go-dark"
              type="button"
              onClick={() => {
                void setTheme("dark");
              }}
            >
              Dark
            </button>
          </>
        );
      };

      render(
        <ThemeProvider persistTheme={persistTheme} theme="light">
          <TestConsumer />
        </ThemeProvider>,
      );

      await user.click(screen.getByTestId("go-dark"));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      expect(screen.getByTestId("theme-label")).toHaveTextContent("light");

      consoleSpy.mockRestore();
    });

    test("calls onThemePersistError with error and attempted theme", async () => {
      const user = userEvent.setup();
      const persistError = new Error("persist failed");
      const persistTheme = vi.fn(async (_theme: Theme) => {
        throw persistError;
      });
      const onThemePersistError = vi.fn();

      const TestConsumer = (): React.ReactElement => {
        const { setTheme, theme } = useTheme();

        return (
          <>
            <span data-testid="theme-label">{theme}</span>
            <button
              data-testid="go-dark"
              type="button"
              onClick={() => {
                void setTheme("dark");
              }}
            >
              Dark
            </button>
          </>
        );
      };

      render(
        <ThemeProvider
          onThemePersistError={onThemePersistError}
          persistTheme={persistTheme}
          theme="light"
        >
          <TestConsumer />
        </ThemeProvider>,
      );

      await user.click(screen.getByTestId("go-dark"));

      await waitFor(() => {
        expect(onThemePersistError).toHaveBeenCalledWith(persistError, "dark");
      });

      expect(screen.getByTestId("theme-label")).toHaveTextContent("light");
    });
  });
});
