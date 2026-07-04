import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import { Bubble, BubbleContent, BubbleGroup, BubbleReactions } from "#/components/bubble";

describe("bubble", () => {
  describe("Bubble component", () => {
    test("exposes data-slot with default variant and alignment", () => {
      render(<Bubble data-testid="bubble" />);

      const bubble = screen.getByTestId("bubble");

      expect(bubble).toHaveAttribute("data-slot", "bubble");
      expect(bubble).toHaveAttribute("data-variant", "default");
      expect(bubble).toHaveAttribute("data-align", "start");
    });

    test("reflects variant and alignment through data attributes", () => {
      render(<Bubble align="end" data-testid="bubble" variant="destructive" />);

      const bubble = screen.getByTestId("bubble");

      expect(bubble).toHaveAttribute("data-variant", "destructive");
      expect(bubble).toHaveAttribute("data-align", "end");
    });
  });

  describe("BubbleContent component", () => {
    test("exposes its data-slot and merges className", () => {
      render(
        <BubbleContent className="custom-class" data-testid="content">
          Hi
        </BubbleContent>,
      );

      const content = screen.getByTestId("content");

      expect(content).toHaveAttribute("data-slot", "bubble-content");
      expect(content).toHaveClass("custom-class");
    });

    test("renders as a button when asChild is set", () => {
      render(
        <BubbleContent asChild>
          <button data-testid="content" type="button">
            Hi
          </button>
        </BubbleContent>,
      );

      expect(screen.getByTestId("content").tagName).toBe("BUTTON");
    });
  });

  describe("BubbleReactions component", () => {
    test("defaults to bottom/end and reflects overrides", () => {
      render(<BubbleReactions align="start" data-testid="reactions" side="top" />);

      const reactions = screen.getByTestId("reactions");

      expect(reactions).toHaveAttribute("data-slot", "bubble-reactions");
      expect(reactions).toHaveAttribute("data-side", "top");
      expect(reactions).toHaveAttribute("data-align", "start");
    });
  });

  describe("BubbleGroup component", () => {
    test("exposes its data-slot", () => {
      render(<BubbleGroup data-testid="group" />);
      expect(screen.getByTestId("group")).toHaveAttribute("data-slot", "bubble-group");
    });
  });

  describe("Accessibility", () => {
    test("has no accessibility violations", async () => {
      const { container } = render(
        <BubbleGroup>
          <Bubble>
            <BubbleContent>Hello</BubbleContent>
          </Bubble>
        </BubbleGroup>,
      );

      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
