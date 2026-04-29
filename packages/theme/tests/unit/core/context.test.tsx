import type React from "react";

import { render, screen } from "@testing-library/react";

import type { Theme } from "#/types";

import { ThemeContext } from "#/core/context";

describe("ThemeContext", () => {
  test("should be a valid React context", () => {
    expect(ThemeContext).toBeDefined();
    expect(ThemeContext.Provider).toBeDefined();
  });

  test("should have null as default value", () => {
    // Render a component that consumes the context without a provider
    // Using React 19's use() would throw, so we test via Provider
    const TestConsumer = (): React.ReactElement => {
      return (
        <ThemeContext.Consumer>
          {(value) => <span data-testid="value">{value === null ? "null" : "unexpected"}</span>}
        </ThemeContext.Consumer>
      );
    };

    render(<TestConsumer />);

    expect(screen.getByTestId("value")).toHaveTextContent("null");
  });

  test("should provide value through Provider", () => {
    const mockValue = {
      isPending: false,
      resolvedTheme: "dark" as const,
      setTheme: vi.fn(async (_value: Theme) => {}),
      theme: "dark" as const,
    };

    const TestConsumer = (): React.ReactElement => {
      return (
        <ThemeContext.Consumer>
          {(value) => (
            <>
              <span data-testid="theme">{value?.theme}</span>
              <span data-testid="resolved">{value?.resolvedTheme}</span>
              <span data-testid="pending">{String(value?.isPending)}</span>
            </>
          )}
        </ThemeContext.Consumer>
      );
    };

    render(
      <ThemeContext value={mockValue}>
        <TestConsumer />
      </ThemeContext>,
    );

    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
    expect(screen.getByTestId("pending")).toHaveTextContent("false");
  });
});
