import { render, renderHook, screen } from "@testing-library/react";
import type React from "react";
import type { ReactNode } from "react";

import { ColorSchemeContext } from "#/core/context";
import { useColorScheme } from "#/core/use-theme";
import type { ColorScheme, ColorSchemeContextType } from "#/types";

/**
 * Helper to create a wrapper component for renderHook
 */
const createWrapper = (value: ColorSchemeContextType) => {
  return function ColorSchemeContextWrapper({ children }: { children: ReactNode }) {
    return <ColorSchemeContext value={value}>{children}</ColorSchemeContext>;
  };
};

describe("useColorScheme Hook", () => {
  describe("without AppearanceProvider", () => {
    test("should throw error when used outside of AppearanceProvider", () => {
      // Suppress console.error for this test since we expect an error
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {
        /* noop */
      });

      expect(() => {
        renderHook(() => useColorScheme());
      }).toThrow("useColorScheme must be used within an AppearanceProvider");

      consoleSpy.mockRestore();
    });
  });

  describe("with AppearanceProvider", () => {
    test("should return colorScheme from context", () => {
      const mockValue: ColorSchemeContextType = {
        isPending: false,
        resolvedColorScheme: "dark",
        setColorScheme: vi.fn(async (_value: ColorScheme) => {}),
        colorScheme: "dark",
      };

      const { result } = renderHook(() => useColorScheme(), {
        wrapper: createWrapper(mockValue),
      });

      expect(result.current.colorScheme).toBe("dark");
    });

    test("should return resolvedColorScheme from context", () => {
      const mockValue: ColorSchemeContextType = {
        isPending: false,
        resolvedColorScheme: "light",
        setColorScheme: vi.fn(async (_value: ColorScheme) => {}),
        colorScheme: "automatic",
      };

      const { result } = renderHook(() => useColorScheme(), {
        wrapper: createWrapper(mockValue),
      });

      expect(result.current.resolvedColorScheme).toBe("light");
    });

    test("should return isPending from context", () => {
      const mockValue: ColorSchemeContextType = {
        isPending: true,
        resolvedColorScheme: "dark",
        setColorScheme: vi.fn(async (_value: ColorScheme) => {}),
        colorScheme: "dark",
      };

      const { result } = renderHook(() => useColorScheme(), {
        wrapper: createWrapper(mockValue),
      });

      expect(result.current.isPending).toBe(true);
    });

    test("should return setColorScheme function from context", () => {
      const mockSetColorScheme = vi.fn(async (_value: ColorScheme) => {});
      const mockValue: ColorSchemeContextType = {
        isPending: false,
        resolvedColorScheme: "dark",
        setColorScheme: mockSetColorScheme,
        colorScheme: "dark",
      };

      const { result } = renderHook(() => useColorScheme(), {
        wrapper: createWrapper(mockValue),
      });

      expect(result.current.setColorScheme).toBe(mockSetColorScheme);
    });

    test("should work in a component", () => {
      const mockValue: ColorSchemeContextType = {
        isPending: false,
        resolvedColorScheme: "dark",
        setColorScheme: vi.fn(async (_value: ColorScheme) => {}),
        colorScheme: "dark",
      };

      const TestComponent = (): React.ReactElement => {
        const { isPending, resolvedColorScheme, colorScheme } = useColorScheme();

        return (
          <div>
            <span data-testid="colorScheme">{colorScheme}</span>
            <span data-testid="resolved">{resolvedColorScheme}</span>
            <span data-testid="pending">{String(isPending)}</span>
          </div>
        );
      };

      render(
        <ColorSchemeContext value={mockValue}>
          <TestComponent />
        </ColorSchemeContext>,
      );

      expect(screen.getByTestId("colorScheme")).toHaveTextContent("dark");
      expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
      expect(screen.getByTestId("pending")).toHaveTextContent("false");
    });
  });
});
