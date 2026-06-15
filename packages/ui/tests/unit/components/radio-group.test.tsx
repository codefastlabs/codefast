import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef } from "react";

import { RadioGroup, RadioGroupItem } from "#/components/radio-group";

describe("radio-group", () => {
  describe("RadioGroup component", () => {
    test("renders with default props", () => {
      render(
        <RadioGroup data-testid="radio-group">
          <RadioGroupItem value="item1" />
          <RadioGroupItem value="item2" />
        </RadioGroup>,
      );

      expect(screen.getByTestId("radio-group")).toBeInTheDocument();
      expect(screen.getAllByRole("radio")).toHaveLength(2);
    });

    test("lays the root out as a flex column while merging a custom className", () => {
      render(<RadioGroup className="custom-class" data-testid="group" />);

      const group = screen.getByTestId("group");

      expect(group).toHaveClass("flex", "flex-col", "custom-class");
    });

    test("exposes the radio-group data-slot", () => {
      render(<RadioGroup data-testid="group" />);
      expect(screen.getByTestId("group")).toHaveAttribute("data-slot", "radio-group");
    });

    test("forwards arbitrary HTML attributes to the underlying element", () => {
      render(<RadioGroup aria-label="Options" data-foo="bar" data-testid="group" />);

      const group = screen.getByTestId("group");

      expect(group).toHaveAttribute("aria-label", "Options");
      expect(group).toHaveAttribute("data-foo", "bar");
    });
  });

  describe("RadioGroupItem component", () => {
    test("reflects the group's value", () => {
      render(
        <RadioGroup value="item2">
          <RadioGroupItem data-testid="item1" value="item1" />
          <RadioGroupItem data-testid="item2" value="item2" />
        </RadioGroup>,
      );

      expect(screen.getByTestId("item1")).not.toBeChecked();
      expect(screen.getByTestId("item2")).toBeChecked();
    });

    test("fires onValueChange when selected", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();

      render(
        <RadioGroup defaultValue="item1" onValueChange={onValueChange}>
          <RadioGroupItem data-testid="item1" value="item1" />
          <RadioGroupItem data-testid="item2" value="item2" />
        </RadioGroup>,
      );

      await user.click(screen.getByTestId("item2"));
      expect(onValueChange).toHaveBeenCalledWith("item2");
    });

    test("supports a custom className and forwards its ref", () => {
      const ref = createRef<HTMLButtonElement>();

      render(
        <RadioGroup>
          <RadioGroupItem ref={ref} className="custom-item" data-testid="item" value="item1" />
        </RadioGroup>,
      );

      expect(screen.getByTestId("item")).toHaveClass("custom-item");
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    test("cannot be selected when disabled", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();

      render(
        <RadioGroup onValueChange={onValueChange}>
          <RadioGroupItem disabled value="item1" />
        </RadioGroup>,
      );

      await user.click(screen.getByRole("radio"));
      expect(onValueChange).not.toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    test("has no accessibility violations", async () => {
      const { container } = render(
        <RadioGroup aria-label="Group options">
          <RadioGroupItem aria-label="Option 1" value="item1" />
          <RadioGroupItem aria-label="Option 2" value="item2" />
        </RadioGroup>,
      );

      const results = await axe(container);

      expect(results).toHaveNoViolations();
    });
  });
});
