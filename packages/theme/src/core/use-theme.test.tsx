import type React from "react";
import type { ReactNode } from "react";

import { render, renderHook, screen } from "@testing-library/react";

import type { ThemeContextType } from "#types";

import { ThemeContext } from "#core/context";
import { useTheme } from "#core/use-theme";

/**
 * Helper to create a wrapper component for renderHook
 */
const createWrapper = (value: ThemeContextType) => {
  return function ThemeContextWrapper({ children }: { children: ReactNode }) {
    return <ThemeContext value={value}>{children}</ThemeContext>;
  };
};

describe("useTheme Hook", () => {
  describe("without ThemeProvider", () => {
    test("should throw error when used outside of ThemeProvider", () => {
      // Suppress console.error for this test since we expect an error
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {
        /* noop */
      });

      expect(() => {
        renderHook(() => useTheme());
      }).toThrow("useTheme must be used within a ThemeProvider");

      consoleSpy.mockRestore();
    });
  });

  describe("with ThemeProvider", () => {
    test("should return theme from context", () => {
      const mockValue: ThemeContextType = {
        isPending: false,
        resolvedTheme: "dark",
        setTheme: jest.fn(),
        theme: "dark",
      };

      const { result } = renderHook(() => useTheme(), {
        wrapper: createWrapper(mockValue),
      });

      expect(result.current.theme).toBe("dark");
    });

    test("should return resolvedTheme from context", () => {
      const mockValue: ThemeContextType = {
        isPending: false,
        resolvedTheme: "light",
        setTheme: jest.fn(),
        theme: "system",
      };

      const { result } = renderHook(() => useTheme(), {
        wrapper: createWrapper(mockValue),
      });

      expect(result.current.resolvedTheme).toBe("light");
    });

    test("should return isPending from context", () => {
      const mockValue: ThemeContextType = {
        isPending: true,
        resolvedTheme: "dark",
        setTheme: jest.fn(),
        theme: "dark",
      };

      const { result } = renderHook(() => useTheme(), {
        wrapper: createWrapper(mockValue),
      });

      expect(result.current.isPending).toBe(true);
    });

    test("should return setTheme function from context", () => {
      const mockSetTheme = jest.fn();
      const mockValue: ThemeContextType = {
        isPending: false,
        resolvedTheme: "dark",
        setTheme: mockSetTheme,
        theme: "dark",
      };

      const { result } = renderHook(() => useTheme(), {
        wrapper: createWrapper(mockValue),
      });

      expect(result.current.setTheme).toBe(mockSetTheme);
    });

    test("should work in a component", () => {
      const mockValue: ThemeContextType = {
        isPending: false,
        resolvedTheme: "dark",
        setTheme: jest.fn(),
        theme: "dark",
      };

      const TestComponent = (): React.ReactElement => {
        const { isPending, resolvedTheme, theme } = useTheme();

        return (
          <div>
            <span data-testid="theme">{theme}</span>
            <span data-testid="resolved">{resolvedTheme}</span>
            <span data-testid="pending">{String(isPending)}</span>
          </div>
        );
      };

      render(
        <ThemeContext value={mockValue}>
          <TestComponent />
        </ThemeContext>,
      );

      expect(screen.getByTestId("theme")).toHaveTextContent("dark");
      expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
      expect(screen.getByTestId("pending")).toHaveTextContent("false");
    });
  });
});
