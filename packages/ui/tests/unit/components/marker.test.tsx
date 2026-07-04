import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import { Marker, MarkerContent, MarkerIcon } from "#/components/marker";

describe("marker", () => {
  describe("Marker component", () => {
    test("exposes the data-slot and defaults to the default variant", () => {
      render(<Marker data-testid="marker" />);

      const marker = screen.getByTestId("marker");

      expect(marker).toHaveAttribute("data-slot", "marker");
      expect(marker).toHaveAttribute("data-variant", "default");
    });

    test("applies the separator variant rules", () => {
      render(<Marker data-testid="marker" variant="separator" />);

      const marker = screen.getByTestId("marker");

      expect(marker).toHaveAttribute("data-variant", "separator");
      expect(marker).toHaveClass("before:flex-1", "after:flex-1");
    });

    test("renders as a child element when asChild is set", () => {
      render(
        <Marker asChild>
          <section data-testid="marker">Today</section>
        </Marker>,
      );

      const marker = screen.getByTestId("marker");

      expect(marker.tagName).toBe("SECTION");
      expect(marker).toHaveAttribute("data-slot", "marker");
    });
  });

  describe("sub-components", () => {
    test("MarkerIcon is decorative and exposes its data-slot", () => {
      render(<MarkerIcon data-testid="icon" />);

      const icon = screen.getByTestId("icon");

      expect(icon).toHaveAttribute("data-slot", "marker-icon");
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });

    test("MarkerContent exposes its data-slot and merges className", () => {
      render(
        <MarkerContent className="custom-class" data-testid="content">
          Today
        </MarkerContent>,
      );

      const content = screen.getByTestId("content");

      expect(content).toHaveAttribute("data-slot", "marker-content");
      expect(content).toHaveClass("custom-class");
    });
  });

  describe("Accessibility", () => {
    test("has no accessibility violations", async () => {
      const { container } = render(
        <Marker variant="separator">
          <MarkerContent>Today</MarkerContent>
        </Marker>,
      );

      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
