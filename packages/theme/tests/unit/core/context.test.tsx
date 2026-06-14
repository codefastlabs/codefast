import { render, screen } from "@testing-library/react";
import type React from "react";

import { ColorSchemeContext } from "#/core/context";
import type { ColorScheme } from "#/types";

describe("ColorSchemeContext", () => {
  test("should be a valid React context", () => {
    expect(ColorSchemeContext).toBeDefined();
    expect(ColorSchemeContext.Provider).toBeDefined();
  });

  test("should have null as default value", () => {
    // Render a component that consumes the context without a provider
    // Using React 19's use() would throw, so we test via Provider
    const TestConsumer = (): React.ReactElement => {
      return (
        <ColorSchemeContext.Consumer>
          {(value) => <span data-testid="value">{value === null ? "null" : "unexpected"}</span>}
        </ColorSchemeContext.Consumer>
      );
    };

    render(<TestConsumer />);

    expect(screen.getByTestId("value")).toHaveTextContent("null");
  });

  test("should provide value through Provider", () => {
    const mockValue = {
      isPending: false,
      resolvedColorScheme: "dark" as const,
      setColorScheme: vi.fn(async (_value: ColorScheme) => {}),
      colorScheme: "dark" as const,
    };

    const TestConsumer = (): React.ReactElement => {
      return (
        <ColorSchemeContext.Consumer>
          {(value) => (
            <>
              <span data-testid="colorScheme">{value?.colorScheme}</span>
              <span data-testid="resolved">{value?.resolvedColorScheme}</span>
              <span data-testid="pending">{String(value?.isPending)}</span>
            </>
          )}
        </ColorSchemeContext.Consumer>
      );
    };

    render(
      <ColorSchemeContext value={mockValue}>
        <TestConsumer />
      </ColorSchemeContext>,
    );

    expect(screen.getByTestId("colorScheme")).toHaveTextContent("dark");
    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
    expect(screen.getByTestId("pending")).toHaveTextContent("false");
  });
});
