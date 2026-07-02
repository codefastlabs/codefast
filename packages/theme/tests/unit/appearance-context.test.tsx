import { render, screen } from "@testing-library/react";
import type React from "react";

import type { Appearance } from "#/appearance";
import { AppearanceContext } from "#/appearance-context";

describe("AppearanceContext", () => {
  test("should be a valid React context", () => {
    expect(AppearanceContext).toBeDefined();
    expect(AppearanceContext.Provider).toBeDefined();
  });

  test("should have null as default value", () => {
    // Render a component that consumes the context without a provider
    // Using React 19's use() would throw, so we test via Provider
    const TestConsumer = (): React.ReactElement => {
      return (
        <AppearanceContext.Consumer>
          {(value) => <span data-testid="value">{value === null ? "null" : "unexpected"}</span>}
        </AppearanceContext.Consumer>
      );
    };

    render(<TestConsumer />);

    expect(screen.getByTestId("value")).toHaveTextContent("null");
  });

  test("should provide value through Provider", () => {
    const mockValue = {
      isPending: false,
      colorScheme: "dark" as const,
      setAppearance: vi.fn(async (_value: Appearance) => {}),
      appearance: "dark" as const,
    };

    const TestConsumer = (): React.ReactElement => {
      return (
        <AppearanceContext.Consumer>
          {(value) => (
            <>
              <span data-testid="appearance">{value?.appearance}</span>
              <span data-testid="resolved">{value?.colorScheme}</span>
              <span data-testid="pending">{String(value?.isPending)}</span>
            </>
          )}
        </AppearanceContext.Consumer>
      );
    };

    render(
      <AppearanceContext value={mockValue}>
        <TestConsumer />
      </AppearanceContext>,
    );

    expect(screen.getByTestId("appearance")).toHaveTextContent("dark");
    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
    expect(screen.getByTestId("pending")).toHaveTextContent("false");
  });
});
