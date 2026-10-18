import type { AppearanceContextValue, ColorScheme } from "@codefast/theme";
import { AppearanceContext } from "@codefast/theme/appearance-context";
import { act, render, screen } from "@testing-library/react";

import { toast, Toaster } from "#components/sonner";

function appearanceWith(colorScheme: ColorScheme): AppearanceContextValue {
  return {
    appearance: "automatic",
    colorScheme,
    isPending: false,
    setAppearance: async () => {},
  };
}

function toasterOf(container: HTMLElement): HTMLElement {
  const toaster = container.querySelector<HTMLElement>("[data-sonner-toaster]");
  if (toaster === null) {
    throw new Error("Toaster rendered no toast list");
  }
  return toaster;
}

describe("toaster", () => {
  afterEach(() => {
    act(() => {
      toast.dismiss();
    });
  });

  test.each<ColorScheme>(["light", "dark"])(
    "renders toasts in the %s color scheme from @codefast/theme",
    async (scheme) => {
      const { container } = render(
        <AppearanceContext value={appearanceWith(scheme)}>
          <Toaster />
        </AppearanceContext>,
      );

      act(() => {
        toast("Saved");
      });
      await screen.findByText("Saved");

      expect(toasterOf(container)).toHaveAttribute("data-sonner-theme", scheme);
    },
  );

  test("follows a color scheme change without remounting", async () => {
    const { container, rerender } = render(
      <AppearanceContext value={appearanceWith("light")}>
        <Toaster />
      </AppearanceContext>,
    );

    act(() => {
      toast("Saved");
    });
    await screen.findByText("Saved");
    expect(toasterOf(container)).toHaveAttribute("data-sonner-theme", "light");

    rerender(
      <AppearanceContext value={appearanceWith("dark")}>
        <Toaster />
      </AppearanceContext>,
    );

    expect(toasterOf(container)).toHaveAttribute("data-sonner-theme", "dark");
  });

  test("requires an AppearanceProvider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<Toaster />)).toThrow("useAppearance must be used within an AppearanceProvider");
  });
});
