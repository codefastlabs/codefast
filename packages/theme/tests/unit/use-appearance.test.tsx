import { render, renderHook, screen } from "@testing-library/react";
import type React from "react";
import type { ReactNode } from "react";

import type { Appearance, AppearanceContextType } from "#/appearance";
import { AppearanceContext } from "#/appearance-context";
import { useAppearance } from "#/use-appearance";

/**
 * Helper to create a wrapper component for renderHook
 */
const createWrapper = (value: AppearanceContextType) => {
  return function AppearanceContextWrapper({ children }: { children: ReactNode }) {
    return <AppearanceContext value={value}>{children}</AppearanceContext>;
  };
};

describe("useAppearance Hook", () => {
  describe("without AppearanceProvider", () => {
    test("should throw error when used outside of AppearanceProvider", () => {
      // Suppress console.error for this test since we expect an error
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {
        /* noop */
      });

      expect(() => {
        renderHook(() => useAppearance());
      }).toThrow("useAppearance must be used within an AppearanceProvider");

      consoleSpy.mockRestore();
    });
  });

  describe("with AppearanceProvider", () => {
    test("should return appearance from context", () => {
      const mockValue: AppearanceContextType = {
        isPending: false,
        colorScheme: "dark",
        setAppearance: vi.fn(async (_value: Appearance) => {}),
        appearance: "dark",
      };

      const { result } = renderHook(() => useAppearance(), {
        wrapper: createWrapper(mockValue),
      });

      expect(result.current.appearance).toBe("dark");
    });

    test("should return colorScheme from context", () => {
      const mockValue: AppearanceContextType = {
        isPending: false,
        colorScheme: "light",
        setAppearance: vi.fn(async (_value: Appearance) => {}),
        appearance: "automatic",
      };

      const { result } = renderHook(() => useAppearance(), {
        wrapper: createWrapper(mockValue),
      });

      expect(result.current.colorScheme).toBe("light");
    });

    test("should return isPending from context", () => {
      const mockValue: AppearanceContextType = {
        isPending: true,
        colorScheme: "dark",
        setAppearance: vi.fn(async (_value: Appearance) => {}),
        appearance: "dark",
      };

      const { result } = renderHook(() => useAppearance(), {
        wrapper: createWrapper(mockValue),
      });

      expect(result.current.isPending).toBe(true);
    });

    test("should return setAppearance function from context", () => {
      const mockSetAppearance = vi.fn(async (_value: Appearance) => {});
      const mockValue: AppearanceContextType = {
        isPending: false,
        colorScheme: "dark",
        setAppearance: mockSetAppearance,
        appearance: "dark",
      };

      const { result } = renderHook(() => useAppearance(), {
        wrapper: createWrapper(mockValue),
      });

      expect(result.current.setAppearance).toBe(mockSetAppearance);
    });

    test("should work in a component", () => {
      const mockValue: AppearanceContextType = {
        isPending: false,
        colorScheme: "dark",
        setAppearance: vi.fn(async (_value: Appearance) => {}),
        appearance: "dark",
      };

      const TestComponent = (): React.ReactElement => {
        const { isPending, colorScheme, appearance } = useAppearance();

        return (
          <div>
            <span data-testid="appearance">{appearance}</span>
            <span data-testid="resolved">{colorScheme}</span>
            <span data-testid="pending">{String(isPending)}</span>
          </div>
        );
      };

      render(
        <AppearanceContext value={mockValue}>
          <TestComponent />
        </AppearanceContext>,
      );

      expect(screen.getByTestId("appearance")).toHaveTextContent("dark");
      expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
      expect(screen.getByTestId("pending")).toHaveTextContent("false");
    });
  });
});
