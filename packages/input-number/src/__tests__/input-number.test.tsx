import type { ReactNode } from "react";

import { axe } from "jest-axe";
import { useId } from "react";

import {
  InputNumber,
  InputNumberDecrementButton,
  InputNumberField,
  InputNumberIncrementButton,
} from "@/input-number";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("input-number", () => {
  describe("InputNumber", () => {
    test("renders correct structure", () => {
      render(
        <InputNumber data-testid="input-number">
          <InputNumberDecrementButton data-testid="decrement-btn">-</InputNumberDecrementButton>
          <InputNumberField data-testid="input-item" />
          <InputNumberIncrementButton data-testid="increment-btn">+</InputNumberIncrementButton>
        </InputNumber>,
      );

      expect(screen.getByTestId("input-number")).toBeInTheDocument();
      expect(screen.getByTestId("decrement-btn")).toBeInTheDocument();
      expect(screen.getByTestId("input-item")).toBeInTheDocument();
      expect(screen.getByTestId("increment-btn")).toBeInTheDocument();
    });

    test("works in uncontrolled mode with defaultValue", async () => {
      const user = userEvent.setup();

      render(
        <InputNumber data-testid="input-number" defaultValue={10}>
          <InputNumberDecrementButton data-testid="decrement-btn">-</InputNumberDecrementButton>
          <InputNumberField data-testid="input-item" />
          <InputNumberIncrementButton data-testid="increment-btn">+</InputNumberIncrementButton>
        </InputNumber>,
      );

      const input = screen.getByTestId("input-item");

      expect(input).toHaveValue("10");

      await user.click(screen.getByTestId("increment-btn"));
      expect(input).toHaveValue("11");

      await user.click(screen.getByTestId("decrement-btn"));
      expect(input).toHaveValue("10");
    });

    test("works in controlled mode", async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();

      const { rerender } = render(
        <InputNumber data-testid="input-number" value={10} onChange={handleChange}>
          <InputNumberDecrementButton data-testid="decrement-btn">-</InputNumberDecrementButton>
          <InputNumberField data-testid="input-item" />
          <InputNumberIncrementButton data-testid="increment-btn">+</InputNumberIncrementButton>
        </InputNumber>,
      );

      const input = screen.getByTestId("input-item");

      expect(input).toHaveValue("10");

      await user.click(screen.getByTestId("increment-btn"));

      expect(handleChange).toHaveBeenCalledWith(11);

      expect(input).toHaveValue("11");

      rerender(
        <InputNumber data-testid="input-number" value={12} onChange={handleChange}>
          <InputNumberDecrementButton data-testid="decrement-btn">-</InputNumberDecrementButton>
          <InputNumberField data-testid="input-item" />
          <InputNumberIncrementButton data-testid="increment-btn">+</InputNumberIncrementButton>
        </InputNumber>,
      );

      expect(input).toHaveValue("12");
    });

    test("respects min/max constraints", async () => {
      const user = userEvent.setup();

      render(
        <InputNumber data-testid="input-number" defaultValue={5} max={10} min={0}>
          <InputNumberDecrementButton data-testid="decrement-btn">-</InputNumberDecrementButton>
          <InputNumberField data-testid="input-item" />
          <InputNumberIncrementButton data-testid="increment-btn">+</InputNumberIncrementButton>
        </InputNumber>,
      );

      const input = screen.getByTestId("input-item");
      const incrementButton = screen.getByTestId("increment-btn");
      const decrementButton = screen.getByTestId("decrement-btn");

      for (let index = 0; index < 10; index++) {
        await user.click(incrementButton);
      }

      expect(input).toHaveValue("10");
      await user.click(incrementButton);
      expect(input).toHaveValue("10");

      for (let index = 0; index < 15; index++) {
        await user.click(decrementButton);
      }

      expect(input).toHaveValue("0");
      await user.click(decrementButton);
      expect(input).toHaveValue("0");
    });

    test("formats value according to formatOptions", () => {
      render(
        <InputNumber
          data-testid="input-number"
          defaultValue={1000.5}
          formatOptions={{ currency: "USD", style: "currency" }}
        >
          <InputNumberField data-testid="input-item" />
        </InputNumber>,
      );

      const input = screen.getByTestId("input-item");

      expect(input).toHaveValue("$1,000.50");
    });

    test("parses input value correctly", async () => {
      const user = userEvent.setup();

      render(
        <InputNumber data-testid="input-number" defaultValue={10}>
          <InputNumberField data-testid="input-item" />
        </InputNumber>,
      );

      const input = screen.getByTestId("input-item");

      await user.clear(input);
      await user.type(input, "25.5");
      await user.tab();

      expect(input).toHaveValue("25.5");
    });

    test("handles keyboard navigation correctly", async () => {
      const user = userEvent.setup();

      render(
        <InputNumber data-testid="input-number" defaultValue={10} max={100} min={0} step={5}>
          <InputNumberField data-testid="input-item" />
        </InputNumber>,
      );

      const input = screen.getByTestId("input-item");

      input.focus();

      await user.keyboard("{ArrowUp}");
      expect(input).toHaveValue("15");

      await user.keyboard("{ArrowDown}");
      expect(input).toHaveValue("10");

      await user.keyboard("{PageDown}");
      expect(input).toHaveValue("0");

      await user.keyboard("{PageUp}");
      expect(input).toHaveValue("100");
    });

    test("should handle Enter key press to confirm entered value", async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();

      render(
        <InputNumber data-testid="input-number" defaultValue={5} onChange={handleChange}>
          <InputNumberDecrementButton data-testid="decrement-btn">-</InputNumberDecrementButton>
          <InputNumberField data-testid="input-item" />
          <InputNumberIncrementButton data-testid="increment-btn">+</InputNumberIncrementButton>
        </InputNumber>,
      );

      const input = screen.getByTestId("input-item");

      await user.clear(input);
      await user.type(input, "42");

      await user.keyboard("{Enter}");

      expect(input).toHaveValue("42");

      expect(handleChange).toHaveBeenCalledWith(42);
    });

    test("should handle Enter key press with percentage values", async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();

      render(
        <InputNumber
          data-testid="input-number"
          defaultValue={0.5}
          formatOptions={{ style: "percent" }}
          onChange={handleChange}
        >
          <InputNumberDecrementButton data-testid="decrement-btn">-</InputNumberDecrementButton>
          <InputNumberField data-testid="input-item" />
          <InputNumberIncrementButton data-testid="increment-btn">+</InputNumberIncrementButton>
        </InputNumber>,
      );

      const input = screen.getByTestId("input-item");

      expect(input).toHaveValue("50%");

      await user.clear(input);
      await user.type(input, "75");

      await user.keyboard("{Enter}");

      expect(input).toHaveValue("75%");

      expect(handleChange).toHaveBeenCalledWith(0.75);
    });

    test("should respect min/max constraints when pressing Enter", async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();

      render(
        <InputNumber
          data-testid="input-number"
          defaultValue={5}
          max={10}
          min={0}
          onChange={handleChange}
        >
          <InputNumberDecrementButton data-testid="decrement-btn">-</InputNumberDecrementButton>
          <InputNumberField data-testid="input-item" />
          <InputNumberIncrementButton data-testid="increment-btn">+</InputNumberIncrementButton>
        </InputNumber>,
      );

      const input = screen.getByTestId("input-item");

      await user.clear(input);
      await user.type(input, "15");
      await user.keyboard("{Enter}");

      expect(input).toHaveValue("10");
      expect(handleChange).toHaveBeenLastCalledWith(10);

      await user.clear(input);
      await user.type(input, "-5");
      await user.keyboard("{Enter}");

      expect(input).toHaveValue("0");
      expect(handleChange).toHaveBeenLastCalledWith(0);
    });

    test("should handle Enter correctly with invalid values", async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();

      render(
        <InputNumber data-testid="input-number" defaultValue={5} onChange={handleChange}>
          <InputNumberDecrementButton data-testid="decrement-btn">-</InputNumberDecrementButton>
          <InputNumberField data-testid="input-item" />
          <InputNumberIncrementButton data-testid="increment-btn">+</InputNumberIncrementButton>
        </InputNumber>,
      );

      const input = screen.getByTestId("input-item");

      await user.clear(input);
      await user.type(input, "abc");
      await user.keyboard("{Enter}");

      expect(input).toHaveValue("");
      expect(handleChange).toHaveBeenLastCalledWith(Number.NaN);

      await user.clear(input);
      await user.keyboard("{Enter}");

      expect(input).toHaveValue("");

      expect(handleChange).toHaveBeenLastCalledWith(Number.NaN);
    });

    test("handles special input cases correctly", async () => {
      const user = userEvent.setup();

      render(
        <InputNumber data-testid="input-number" max={100} min={0}>
          <InputNumberField data-testid="input-item" />
        </InputNumber>,
      );

      const input = screen.getByTestId("input-item");

      await user.clear(input);
      await user.tab();
      expect(input).toHaveValue("");

      await user.clear(input);
      await user.type(input, "abc");
      await user.tab();
      expect(input).toHaveValue("");

      await user.clear(input);
      await user.type(input, "150");
      await user.tab();
      expect(input).toHaveValue("100");

      await user.clear(input);
      await user.type(input, "-10");
      await user.tab();
      expect(input).toHaveValue("0");
    });

    test("respects disabled state", async () => {
      const user = userEvent.setup();

      render(
        <InputNumber disabled data-testid="input-number" defaultValue={10}>
          <InputNumberDecrementButton data-testid="decrement-btn">-</InputNumberDecrementButton>
          <InputNumberField data-testid="input-item" />
          <InputNumberIncrementButton data-testid="increment-btn">+</InputNumberIncrementButton>
        </InputNumber>,
      );

      expect(screen.getByTestId("input-item")).toBeDisabled();
      expect(screen.getByTestId("decrement-btn")).toBeDisabled();
      expect(screen.getByTestId("increment-btn")).toBeDisabled();

      await user.click(screen.getByTestId("increment-btn"));
      expect(screen.getByTestId("input-item")).toHaveValue("10");
    });

    test("should decrement value on wheel up event when input is focused", async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();

      render(
        <InputNumber data-testid="input-number" defaultValue={5} onChange={handleChange}>
          <InputNumberDecrementButton data-testid="decrement-btn">-</InputNumberDecrementButton>
          <InputNumberField data-testid="input-item" />
          <InputNumberIncrementButton data-testid="increment-btn">+</InputNumberIncrementButton>
        </InputNumber>,
      );

      const input = screen.getByTestId("input-item");

      await user.click(input);

      fireEvent.wheel(input, { deltaY: -100 });

      expect(input).toHaveValue("4");
      expect(handleChange).toHaveBeenCalledWith(4);
    });

    test("should increment value on wheel down event when input is focused", async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();

      render(
        <InputNumber data-testid="input-number" defaultValue={5} onChange={handleChange}>
          <InputNumberDecrementButton data-testid="decrement-btn">-</InputNumberDecrementButton>
          <InputNumberField data-testid="input-item" />
          <InputNumberIncrementButton data-testid="increment-btn">+</InputNumberIncrementButton>
        </InputNumber>,
      );

      const input = screen.getByTestId("input-item");

      await user.click(input);

      fireEvent.wheel(input, { deltaY: 100 });

      expect(input).toHaveValue("6");
      expect(handleChange).toHaveBeenCalledWith(6);
    });

    test("should respect min/max constraints on wheel events", async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();

      render(
        <InputNumber
          data-testid="input-number"
          defaultValue={9}
          max={10}
          min={0}
          onChange={handleChange}
        >
          <InputNumberDecrementButton data-testid="decrement-btn">-</InputNumberDecrementButton>
          <InputNumberField data-testid="input-item" />
          <InputNumberIncrementButton data-testid="increment-btn">+</InputNumberIncrementButton>
        </InputNumber>,
      );

      const input = screen.getByTestId("input-item");

      await user.click(input);

      fireEvent.wheel(input, { deltaY: 100 });
      expect(input).toHaveValue("10");

      fireEvent.wheel(input, { deltaY: 100 });
      expect(input).toHaveValue("10");

      fireEvent.wheel(input, { deltaY: -100 });
      expect(input).toHaveValue("9");

      render(
        <InputNumber
          data-testid="input-number-min"
          defaultValue={1}
          max={10}
          min={0}
          onChange={handleChange}
        >
          <InputNumberDecrementButton data-testid="decrement-btn-min">-</InputNumberDecrementButton>
          <InputNumberField data-testid="input-item-min" />
          <InputNumberIncrementButton data-testid="increment-btn-min">+</InputNumberIncrementButton>
        </InputNumber>,
      );

      const minInput = screen.getByTestId("input-item-min");

      await user.click(minInput);

      fireEvent.wheel(minInput, { deltaY: -100 });
      expect(minInput).toHaveValue("0");

      fireEvent.wheel(minInput, { deltaY: -100 });
      expect(minInput).toHaveValue("0");
    });

    test("should honor step value when using wheel events", async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();

      render(
        <InputNumber data-testid="input-number" defaultValue={5} step={0.5} onChange={handleChange}>
          <InputNumberDecrementButton data-testid="decrement-btn">-</InputNumberDecrementButton>
          <InputNumberField data-testid="input-item" />
          <InputNumberIncrementButton data-testid="increment-btn">+</InputNumberIncrementButton>
        </InputNumber>,
      );

      const input = screen.getByTestId("input-item");

      await user.click(input);

      fireEvent.wheel(input, { deltaY: 100 });
      expect(input).toHaveValue("5.5");
      expect(handleChange).toHaveBeenCalledWith(5.5);

      fireEvent.wheel(input, { deltaY: -100 });
      expect(input).toHaveValue("5");
      expect(handleChange).toHaveBeenCalledWith(5);
    });

    test("should not respond to wheel events when disabled", async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();

      render(
        <InputNumber disabled data-testid="input-number" defaultValue={5} onChange={handleChange}>
          <InputNumberDecrementButton data-testid="decrement-btn">-</InputNumberDecrementButton>
          <InputNumberField data-testid="input-item" />
          <InputNumberIncrementButton data-testid="increment-btn">+</InputNumberIncrementButton>
        </InputNumber>,
      );

      const input = screen.getByTestId("input-item");

      await user.click(input);

      fireEvent.wheel(input, { deltaY: -100 });
      fireEvent.wheel(input, { deltaY: 100 });

      expect(input).toHaveValue("5");
      expect(handleChange).not.toHaveBeenCalled();
    });

    test("should not respond to wheel events when not focused", () => {
      const handleChange = jest.fn();

      render(
        <InputNumber data-testid="input-number" defaultValue={5} onChange={handleChange}>
          <InputNumberDecrementButton data-testid="decrement-btn">-</InputNumberDecrementButton>
          <InputNumberField data-testid="input-item" />
          <InputNumberIncrementButton data-testid="increment-btn">+</InputNumberIncrementButton>
        </InputNumber>,
      );

      const input = screen.getByTestId("input-item");

      fireEvent.wheel(input, { deltaY: -100 });

      expect(input).toHaveValue("5");
      expect(handleChange).not.toHaveBeenCalled();
    });

    test("right-clicking on increment/decrement buttons should affect the value like left clicking", async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();

      render(
        <InputNumber data-testid="input-number" defaultValue={10} onChange={handleChange}>
          <InputNumberDecrementButton data-testid="decrement-btn">-</InputNumberDecrementButton>
          <InputNumberField data-testid="input-item" />
          <InputNumberIncrementButton data-testid="increment-btn">+</InputNumberIncrementButton>
        </InputNumber>,
      );

      const input = screen.getByTestId("input-item");
      const incrementButton = screen.getByTestId("increment-btn");
      const decrementButton = screen.getByTestId("decrement-btn");

      expect(input).toHaveValue("10");

      await user.pointer({
        keys: "[MouseRight]",
        target: incrementButton,
      });

      expect(input).toHaveValue("11");
      expect(handleChange).toHaveBeenCalledWith(11);

      await user.pointer({
        keys: "[MouseRight]",
        target: decrementButton,
      });

      expect(input).toHaveValue("10");
      expect(handleChange).toHaveBeenCalledWith(10);

      await user.click(incrementButton);
      expect(input).toHaveValue("11");
      expect(handleChange).toHaveBeenCalledWith(11);
    });

    test("should increment continuously when increment button is pressed and held", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      jest.useFakeTimers();

      const onChange = jest.fn();

      render(
        <InputNumber data-testid="input-number" defaultValue={5} onChange={onChange}>
          <InputNumberDecrementButton data-testid="decrement-btn">-</InputNumberDecrementButton>
          <InputNumberField data-testid="input-item" />
          <InputNumberIncrementButton data-testid="increment-btn">+</InputNumberIncrementButton>
        </InputNumber>,
      );

      const input = screen.getByTestId("input-item");
      const incrementButton = screen.getByTestId("increment-btn");

      expect(input).toHaveValue("5");

      await user.pointer({ keys: "[MouseLeft>]", target: incrementButton });

      expect(input).toHaveValue("6");

      act(() => {
        jest.advanceTimersByTime(200);
      });
      expect(input).toHaveValue("7");

      act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(input).toHaveValue("8");

      act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(input).toHaveValue("9");

      await user.pointer({ keys: "[/MouseLeft]" });

      act(() => {
        jest.advanceTimersByTime(300);
      });
      expect(input).toHaveValue("9");

      jest.useRealTimers();
    });

    test("should decrement continuously when decrement button is pressed and held", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      jest.useFakeTimers();

      const onChange = jest.fn();

      render(
        <InputNumber data-testid="input-number" defaultValue={10} onChange={onChange}>
          <InputNumberDecrementButton data-testid="decrement-btn">-</InputNumberDecrementButton>
          <InputNumberField data-testid="input-item" />
          <InputNumberIncrementButton data-testid="increment-btn">+</InputNumberIncrementButton>
        </InputNumber>,
      );

      const input = screen.getByTestId("input-item");
      const decrementButton = screen.getByTestId("decrement-btn");

      expect(input).toHaveValue("10");

      await user.pointer({ keys: "[MouseLeft>]", target: decrementButton });

      expect(input).toHaveValue("9");

      act(() => {
        jest.advanceTimersByTime(200);
      });
      expect(input).toHaveValue("8");

      act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(input).toHaveValue("7");

      await user.pointer({ keys: "[/MouseLeft]" });

      act(() => {
        jest.advanceTimersByTime(300);
      });
      expect(input).toHaveValue("7");

      jest.useRealTimers();
    });

    test("should stop incrementing when pointer leaves the button", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      jest.useFakeTimers();

      render(
        <InputNumber data-testid="input-number" defaultValue={5}>
          <InputNumberDecrementButton data-testid="decrement-btn">-</InputNumberDecrementButton>
          <InputNumberField data-testid="input-item" />
          <InputNumberIncrementButton data-testid="increment-btn">+</InputNumberIncrementButton>
        </InputNumber>,
      );

      const input = screen.getByTestId("input-item");
      const incrementButton = screen.getByTestId("increment-btn");

      await user.pointer({ keys: "[MouseLeft>]", target: incrementButton });
      expect(input).toHaveValue("6");

      act(() => {
        jest.advanceTimersByTime(200);
      });
      expect(input).toHaveValue("7");

      await user.pointer({ target: document.body });

      act(() => {
        jest.advanceTimersByTime(300);
      });
      expect(input).toHaveValue("7");

      jest.useRealTimers();
    });

    test("applies step size correctly", async () => {
      const user = userEvent.setup();

      render(
        <InputNumber data-testid="input-number" defaultValue={5} step={2.5}>
          <InputNumberDecrementButton data-testid="decrement-btn">-</InputNumberDecrementButton>
          <InputNumberField data-testid="input-item" />
          <InputNumberIncrementButton data-testid="increment-btn">+</InputNumberIncrementButton>
        </InputNumber>,
      );

      const input = screen.getByTestId("input-item");

      await user.click(screen.getByTestId("increment-btn"));
      expect(input).toHaveValue("7.5");

      await user.click(screen.getByTestId("decrement-btn"));
      expect(input).toHaveValue("5");
    });

    test("formats numbers according to formatOptions", () => {
      render(
        <InputNumber
          data-testid="input-number"
          defaultValue={1234.5}
          formatOptions={{ currency: "USD", style: "currency" }}
        >
          <InputNumberField data-testid="input-item" />
        </InputNumber>,
      );

      const input = screen.getByTestId("input-item");

      expect(input).toHaveValue("$1,234.50");
    });

    test("disables all interactions when disabled", async () => {
      const user = userEvent.setup();

      render(
        <InputNumber disabled data-testid="input-number" defaultValue={5}>
          <InputNumberDecrementButton data-testid="decrement-btn">-</InputNumberDecrementButton>
          <InputNumberField data-testid="input-item" />
          <InputNumberIncrementButton data-testid="increment-btn">+</InputNumberIncrementButton>
        </InputNumber>,
      );

      const input = screen.getByTestId("input-item");

      expect(input).toBeDisabled();

      const incrementButton = screen.getByTestId("increment-btn");
      const decrementButton = screen.getByTestId("decrement-btn");

      expect(incrementButton).toBeDisabled();
      expect(decrementButton).toBeDisabled();

      await user.click(incrementButton);
      expect(input).toHaveValue("5");
    });

    test("has no accessibility violations", async () => {
      const TestComponent = (): ReactNode => {
        const id = useId();

        return (
          <div>
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label htmlFor={`${id}-number-input`}>Number Input</label>
            <InputNumber data-testid="input-number" defaultValue={5} id={`${id}-number-input`}>
              <InputNumberDecrementButton data-testid="decrement-btn">-</InputNumberDecrementButton>
              <InputNumberField aria-labelledby={`${id}-number-label`} data-testid="input-item" />
              <InputNumberIncrementButton data-testid="increment-btn">+</InputNumberIncrementButton>
            </InputNumber>
          </div>
        );
      };

      const { container } = render(<TestComponent />);

      const results = await axe(container);

      expect(results).toHaveNoViolations();
    });

    test("passes id to InputNumberItem", () => {
      render(
        <InputNumber data-testid="input-number" id="test-id">
          <InputNumberDecrementButton data-testid="decrement-btn">-</InputNumberDecrementButton>
          <InputNumberField data-testid="input-item" />
          <InputNumberIncrementButton data-testid="increment-btn">+</InputNumberIncrementButton>
        </InputNumber>,
      );

      const input = screen.getByTestId("input-item");

      expect(input).toHaveAttribute("id", "test-id");
    });

    test("supports keyboard operations (Enter and Space) on buttons", async () => {
      const user = userEvent.setup();

      render(
        <InputNumber data-testid="input-number" defaultValue={5}>
          <InputNumberDecrementButton data-testid="decrement-btn">-</InputNumberDecrementButton>
          <InputNumberField data-testid="input-item" />
          <InputNumberIncrementButton data-testid="increment-btn">+</InputNumberIncrementButton>
        </InputNumber>,
      );

      const input = screen.getByTestId("input-item");

      expect(input).toHaveValue("5");

      await user.tab();
      await user.tab();
      await user.tab();
      await user.keyboard("{Enter}");
      expect(input).toHaveValue("6");

      await user.keyboard(" ");
      expect(input).toHaveValue("7");

      await user.tab({ shift: true });
      await user.tab({ shift: true });
      await user.keyboard("{Enter}");
      expect(input).toHaveValue("6");

      await user.keyboard(" ");
      expect(input).toHaveValue("5");
    });

    test("allows function keys (F1-F12) in input", async () => {
      const user = userEvent.setup();

      render(
        <InputNumber data-testid="input-number" defaultValue={5}>
          <InputNumberDecrementButton data-testid="decrement-btn">-</InputNumberDecrementButton>
          <InputNumberField data-testid="input-item" />
          <InputNumberIncrementButton data-testid="increment-btn">+</InputNumberIncrementButton>
        </InputNumber>,
      );

      const input = screen.getByTestId("input-item");

      await user.click(input);

      const preventDefaultMock = jest.fn();

      const functionKeys = ["F1", "F5", "F12"];

      for (const key of functionKeys) {
        const keyboardEvent = new KeyboardEvent("keydown", {
          bubbles: true,
          cancelable: true,
          key,
        });

        Object.defineProperty(keyboardEvent, "preventDefault", {
          value: preventDefaultMock,
        });

        input.dispatchEvent(keyboardEvent);
      }

      expect(preventDefaultMock).not.toHaveBeenCalled();
    });

    test("inputNumber resets when form is reset", async () => {
      const user = userEvent.setup();

      render(
        <form data-testid="test-form">
          <InputNumber data-testid="input-number" defaultValue={5}>
            <InputNumberDecrementButton data-testid="decrement-btn">-</InputNumberDecrementButton>
            <InputNumberField data-testid="input-item" />
            <InputNumberIncrementButton data-testid="increment-btn">+</InputNumberIncrementButton>
          </InputNumber>
          <button data-testid="reset-button" type="reset">
            Reset
          </button>
        </form>,
      );

      const input = screen.getByTestId("input-item");
      const incrementButton = screen.getByTestId("increment-btn");
      const resetButton = screen.getByTestId("reset-button");

      expect(input).toHaveValue("5");

      await user.click(incrementButton);
      await user.click(incrementButton);
      expect(input).toHaveValue("7");

      await user.click(resetButton);

      expect(input).toHaveValue("5");

      await user.clear(input);
      await user.type(input, "42");
      expect(input).toHaveValue("42");

      await user.click(resetButton);

      expect(input).toHaveValue("5");
    });
  });

  describe("InputNumberItem", () => {
    test("handles direct user input", async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();

      render(
        <InputNumber defaultValue={10} onChange={handleChange}>
          <InputNumberField data-testid="input-item" />
        </InputNumber>,
      );

      const input = screen.getByTestId("input-item");

      await user.clear(input);

      await user.type(input, "42");

      await user.tab();

      expect(input).toHaveValue("42");
      expect(handleChange).toHaveBeenCalledWith(42);
    });

    test("validates and formats on blur", async () => {
      const user = userEvent.setup();

      render(
        <InputNumber defaultValue={5} max={100} min={0}>
          <InputNumberField data-testid="input-item" />
        </InputNumber>,
      );

      const input = screen.getByTestId("input-item");

      await user.clear(input);
      await user.type(input, "200");
      await user.tab();

      expect(input).toHaveValue("100");

      await user.clear(input);
      await user.type(input, "-10");
      await user.tab();

      expect(input).toHaveValue("0");
    });

    test("handles keyboard navigation", async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();

      render(
        <InputNumber defaultValue={10} max={100} min={0} onChange={handleChange}>
          <InputNumberField data-testid="input-item" />
        </InputNumber>,
      );

      const input = screen.getByTestId("input-item");

      await user.click(input);

      await user.keyboard("{ArrowUp}");
      expect(handleChange).toHaveBeenCalledWith(11);
      expect(input).toHaveValue("11");

      handleChange.mockClear();

      await user.keyboard("{ArrowDown}");
      expect(handleChange).toHaveBeenCalledWith(10);
      expect(input).toHaveValue("10");

      handleChange.mockClear();

      await user.keyboard("{PageUp}");
      expect(handleChange).toHaveBeenCalledWith(100);
      expect(input).toHaveValue("100");

      handleChange.mockClear();

      await user.keyboard("{PageDown}");
      expect(handleChange).toHaveBeenCalledWith(0);
      expect(input).toHaveValue("0");
    });
  });

  describe("InputNumberDecrementButton", () => {
    test("decreases value when clicked", async () => {
      const user = userEvent.setup();

      render(
        <InputNumber defaultValue={10}>
          <InputNumberDecrementButton data-testid="decrement-btn">-</InputNumberDecrementButton>
          <InputNumberField data-testid="input-item" />
        </InputNumber>,
      );

      const button = screen.getByTestId("decrement-btn");
      const input = screen.getByTestId("input-item");

      await user.click(button);
      expect(input).toHaveValue("9");

      await user.click(button);
      expect(input).toHaveValue("8");
    });

    test("becomes disabled at minimum value", () => {
      render(
        <InputNumber defaultValue={1} min={1}>
          <InputNumberDecrementButton data-testid="decrement-btn">-</InputNumberDecrementButton>
          <InputNumberField data-testid="input-item" />
        </InputNumber>,
      );

      const button = screen.getByTestId("decrement-btn");

      expect(button).toBeDisabled();
    });

    test("supports custom rendering", () => {
      render(
        <InputNumber defaultValue={10}>
          <InputNumberDecrementButton data-testid="decrement-btn">
            <span>Decrease</span>
          </InputNumberDecrementButton>
          <InputNumberField />
        </InputNumber>,
      );

      expect(screen.getByText("Decrease")).toBeInTheDocument();
    });
  });

  describe("InputNumberIncrementButton", () => {
    test("increases value when clicked", async () => {
      const user = userEvent.setup();

      render(
        <InputNumber defaultValue={10}>
          <InputNumberField data-testid="input-item" />
          <InputNumberIncrementButton data-testid="increment-btn">+</InputNumberIncrementButton>
        </InputNumber>,
      );

      const button = screen.getByTestId("increment-btn");
      const input = screen.getByTestId("input-item");

      await user.click(button);
      expect(input).toHaveValue("11");

      await user.click(button);
      expect(input).toHaveValue("12");
    });

    test("becomes disabled at maximum value", () => {
      render(
        <InputNumber defaultValue={100} max={100}>
          <InputNumberField />
          <InputNumberIncrementButton data-testid="increment-btn">+</InputNumberIncrementButton>
        </InputNumber>,
      );

      const button = screen.getByTestId("increment-btn");

      expect(button).toBeDisabled();
    });

    test("supports custom rendering", () => {
      render(
        <InputNumber defaultValue={10}>
          <InputNumberField />
          <InputNumberIncrementButton data-testid="increment-btn">
            <span>Increase</span>
          </InputNumberIncrementButton>
        </InputNumber>,
      );

      expect(screen.getByText("Increase")).toBeInTheDocument();
    });
  });

  describe("InputNumber Integration Tests", () => {
    test("works together as a complete component", async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();

      render(
        <InputNumber
          data-testid="number-input"
          defaultValue={50}
          max={100}
          min={0}
          step={5}
          onChange={handleChange}
        >
          <InputNumberDecrementButton data-testid="decrement">-</InputNumberDecrementButton>
          <InputNumberField data-testid="input" />
          <InputNumberIncrementButton data-testid="increment">+</InputNumberIncrementButton>
        </InputNumber>,
      );

      const input = screen.getByTestId("input");
      const decrementButton = screen.getByTestId("decrement");
      const incrementButton = screen.getByTestId("increment");

      expect(input).toHaveValue("50");

      await user.click(incrementButton);
      expect(input).toHaveValue("55");
      expect(handleChange).toHaveBeenCalledWith(55);

      await user.click(decrementButton);
      expect(input).toHaveValue("50");
      expect(handleChange).toHaveBeenCalledWith(50);

      await user.clear(input);
      await user.type(input, "75");
      await user.tab();
      expect(handleChange).toHaveBeenCalledWith(75);
      expect(input).toHaveValue("75");

      await user.clear(input);
      await user.type(input, "150");
      expect(input).toHaveValue("150");

      await user.clear(input);
      await user.type(input, "-20");
      expect(input).toHaveValue("-20");
    });

    test("properly applies formatting and locale", () => {
      render(
        <InputNumber
          data-testid="number-input"
          defaultValue={1234.56}
          formatOptions={{ currency: "EUR", style: "currency" }}
          locale="de-DE"
        >
          <InputNumberDecrementButton data-testid="decrement">-</InputNumberDecrementButton>
          <InputNumberField data-testid="input" />
          <InputNumberIncrementButton data-testid="increment">+</InputNumberIncrementButton>
        </InputNumber>,
      );

      const input = screen.getByTestId("input");

      expect(input).toHaveValue("1.234,56\u00A0€");
    });

    test("handles invalid user input gracefully", async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();

      render(
        <InputNumber data-testid="number-input" defaultValue={50} onChange={handleChange}>
          <InputNumberField data-testid="input" />
        </InputNumber>,
      );

      const input = screen.getByTestId("input");

      await user.type(input, "abc");

      expect(handleChange).not.toHaveBeenCalledWith(Number.NaN);

      await user.tab();
      expect(input).toHaveValue("50");
    });
  });
});
