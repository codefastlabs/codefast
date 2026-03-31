import type React from "react";

import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ThemeProvider } from "#core/provider";
import { useTheme } from "#core/use-theme";

describe("ThemeProvider", () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    // Reset document state
    document.documentElement.className = "";
    document.documentElement.style.colorScheme = "";

    // Default matchMedia mock (light mode)
    Object.defineProperty(window, "matchMedia", {
      value: jest.fn().mockImplementation((query: string) => ({
        addEventListener: jest.fn(),
        addListener: jest.fn(),
        dispatchEvent: jest.fn(),
        matches: false,
        media: query,
        onchange: null,
        removeEventListener: jest.fn(),
        removeListener: jest.fn(),
      })),
      writable: true,
    });
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
      Object.defineProperty(window, "matchMedia", {
        value: jest.fn().mockImplementation(() => ({
          addEventListener: jest.fn(),
          addListener: jest.fn(),
          dispatchEvent: jest.fn(),
          matches: false, // light mode
          media: "",
          onchange: null,
          removeEventListener: jest.fn(),
          removeListener: jest.fn(),
        })),
        writable: true,
      });

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
      Object.defineProperty(window, "matchMedia", {
        value: jest.fn().mockImplementation((query: string) => ({
          addEventListener: jest.fn(),
          addListener: jest.fn(),
          dispatchEvent: jest.fn(),
          matches: query === "(prefers-color-scheme: dark)",
          media: query,
          onchange: null,
          removeEventListener: jest.fn(),
          removeListener: jest.fn(),
        })),
        writable: true,
      });

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
      const mockPersistTheme = jest.fn().mockResolvedValue(undefined);

      const TestConsumer = (): React.ReactElement => {
        const { setTheme } = useTheme();

        return (
          <button data-testid="toggle" onClick={async () => setTheme("dark")}>
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
      const mockPersistTheme = jest.fn().mockResolvedValue(undefined);

      const TestConsumer = (): React.ReactElement => {
        const { setTheme, theme } = useTheme();

        return (
          <button data-testid="toggle" onClick={async () => setTheme(theme)}>
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
      const sync = jest.fn().mockResolvedValue("dark");

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
  });
});
