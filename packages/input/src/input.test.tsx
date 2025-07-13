import { axe } from "jest-axe";

import { Input, InputField } from "@/input";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("input", () => {
  describe("Rendering", () => {
    test("should render Input with InputItem correctly", () => {
      render(
        <Input>
          <InputField placeholder="Enter text" />
        </Input>,
      );

      expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
    });

    test("should render with prefix and suffix", () => {
      render(
        <Input prefix={<div data-testid="prefix">Prefix</div>} suffix={<div data-testid="suffix">Suffix</div>}>
          <InputField />
        </Input>,
      );

      expect(screen.getByTestId("prefix")).toBeInTheDocument();
      expect(screen.getByTestId("suffix")).toBeInTheDocument();
    });

    test("should render loading spinner in prefix position by default", () => {
      render(
        <Input loading spinner={<div data-testid="spinner">Loading...</div>}>
          <InputField />
        </Input>,
      );

      expect(screen.getByTestId("spinner")).toBeInTheDocument();
    });

    test("should render loading spinner in suffix position when specified", () => {
      render(
        <Input
          loading
          loaderPosition="suffix"
          prefix={<div data-testid="prefix">Prefix</div>}
          spinner={<div data-testid="spinner">Loading...</div>}
        >
          <InputField />
        </Input>,
      );

      expect(screen.getByTestId("spinner")).toBeInTheDocument();
      expect(screen.getByTestId("prefix")).toBeInTheDocument();
    });
  });

  describe("Behavior", () => {
    test("should focus input when clicking on container", async () => {
      const user = userEvent.setup();

      render(
        <Input>
          <InputField data-testid="input" />
        </Input>,
      );

      const container = screen.getByRole("presentation");
      const input = screen.getByTestId("input");

      await user.click(container);

      await new Promise((resolve) => {
        requestAnimationFrame(resolve);
      });

      expect(input).toHaveFocus();
    });

    test("should not stop propagation when clicking directly on input", async () => {
      const containerClickHandler = jest.fn();
      const inputClickHandler = jest.fn();
      const user = userEvent.setup();

      render(
        // @ts-expect-error - onClick prop is not defined in the Input component props type
        <Input onClick={containerClickHandler}>
          <InputField data-testid="input" onClick={inputClickHandler} />
        </Input>,
      );

      const input = screen.getByTestId("input");

      await user.click(input);

      expect(inputClickHandler).toHaveBeenCalledWith(expect.any(Object));
      expect(containerClickHandler).toHaveBeenCalledWith(expect.any(Object));
    });

    test("should trigger click on file input when container is clicked", async () => {
      const user = userEvent.setup();

      render(
        <Input>
          <InputField data-testid="file-input" type="file" />
        </Input>,
      );

      const container = screen.getByRole("presentation");
      const fileInput = screen.getByTestId("file-input");
      const clickSpy = jest.spyOn(fileInput, "click");

      const rafSpy = jest
        .spyOn(globalThis, "requestAnimationFrame")
        .mockImplementation((callback) => setTimeout(callback, 0));

      await user.click(container);

      await new Promise((resolve) => {
        requestAnimationFrame(resolve);
      });

      expect(clickSpy).toHaveBeenCalledWith();

      rafSpy.mockRestore();
    });

    test("should prevent default behavior when container is clicked while input already has focus", async () => {
      render(
        <Input>
          <InputField data-testid="input" />
        </Input>,
      );

      const container = screen.getByRole("presentation");
      const input = screen.getByTestId("input");

      input.focus();
      expect(input).toHaveFocus();

      const focusSpy = jest.spyOn(input, "focus");

      const mockPreventDefault = jest.fn();
      const pointerEvent = new Event("pointerdown", {
        bubbles: true,
        cancelable: true,
      });

      Object.defineProperty(pointerEvent, "preventDefault", {
        value: mockPreventDefault,
      });

      container.dispatchEvent(pointerEvent);

      await new Promise((resolve) => {
        requestAnimationFrame(resolve);
      });

      expect(mockPreventDefault).toHaveBeenCalledWith();

      expect(focusSpy).not.toHaveBeenCalled();

      expect(input).toHaveFocus();
    });
  });

  describe("Attributes", () => {
    test("should apply disabled attribute correctly", () => {
      render(
        <Input disabled>
          <InputField data-testid="input" />
        </Input>,
      );

      const container = screen.getByRole("presentation");
      const input = screen.getByTestId("input");

      expect(container).toHaveAttribute("data-disabled", "true");
      expect(input).toBeDisabled();
    });

    test("should apply readOnly attribute correctly", () => {
      render(
        <Input readOnly>
          <InputField data-testid="input" />
        </Input>,
      );

      const container = screen.getByRole("presentation");
      const input = screen.getByTestId("input");

      expect(container).toHaveAttribute("data-readonly", "true");
      expect(input).toHaveAttribute("readonly");
    });

    test("should pass additional props to container div", () => {
      render(
        <Input aria-label="test input" data-testid="container">
          <InputField />
        </Input>,
      );

      const container = screen.getByTestId("container");

      expect(container).toHaveAttribute("aria-label", "test input");
    });

    test("should pass additional props to input element", () => {
      render(
        <Input>
          <InputField data-testid="input" maxLength={10} />
        </Input>,
      );

      const input = screen.getByTestId("input");

      expect(input).toHaveAttribute("maxlength", "10");
    });
  });

  describe("User interactions", () => {
    test("should update value when typing", async () => {
      const user = userEvent.setup();

      render(
        <Input>
          <InputField data-testid="input" />
        </Input>,
      );

      const input = screen.getByTestId("input");

      await user.type(input, "Hello world");

      expect(input).toHaveValue("Hello world");
    });

    test("should not allow typing when disabled", async () => {
      const user = userEvent.setup();

      render(
        <Input disabled>
          <InputField data-testid="input" />
        </Input>,
      );

      const input = screen.getByTestId("input");

      await user.type(input, "Hello world");

      expect(input).toHaveValue("");
    });

    test("should not allow typing when readOnly", async () => {
      const user = userEvent.setup();

      render(
        <Input readOnly>
          <InputField data-testid="input" defaultValue="Initial value" />
        </Input>,
      );

      const input = screen.getByTestId("input");

      await user.type(input, "New value");

      expect(input).toHaveValue("Initial value");
    });
  });

  describe("Accessibility", () => {
    test("should not have accessibility violations", async () => {
      const { container } = render(
        <Input>
          <InputField placeholder="Enter text" />
        </Input>,
      );

      const results = await axe(container);

      expect(results).toHaveNoViolations();
    });

    test("should handle keyboard navigation correctly", async () => {
      const user = userEvent.setup();

      render(
        <div>
          <button data-testid="before" type="button">
            Before
          </button>
          <Input>
            <InputField data-testid="input" />
          </Input>
          <button data-testid="after" type="button">
            After
          </button>
        </div>,
      );

      const beforeButton = screen.getByTestId("before");
      const input = screen.getByTestId("input");
      const afterButton = screen.getByTestId("after");

      beforeButton.focus();
      expect(beforeButton).toHaveFocus();

      await user.tab();
      expect(input).toHaveFocus();

      await user.tab();
      expect(afterButton).toHaveFocus();
    });
  });

  describe("Edge cases", () => {
    test("should handle nested clickable elements correctly", async () => {
      const user = userEvent.setup();
      const linkClickHandler = jest.fn();

      render(
        <Input
          prefix={
            <button data-testid="button" type="button" onClick={linkClickHandler}>
              Click me
            </button>
          }
        >
          <InputField data-testid="input" />
        </Input>,
      );

      const button = screen.getByTestId("button");
      const input = screen.getByTestId("input");

      await user.click(button);

      expect(linkClickHandler).toHaveBeenCalledWith(expect.any(Object));
      expect(input).not.toHaveFocus();
    });

    test("should work without InputItem", () => {
      render(
        <Input data-testid="container">
          <div data-testid="custom-content">Custom content</div>
        </Input>,
      );

      expect(screen.getByTestId("container")).toBeInTheDocument();
      expect(screen.getByTestId("custom-content")).toBeInTheDocument();
    });

    test("should handle multiple InputItems correctly", () => {
      render(
        <Input>
          <InputField data-testid="input1" />
          <InputField data-testid="input2" />
        </Input>,
      );

      expect(screen.getByTestId("input1")).toBeInTheDocument();
      expect(screen.getByTestId("input2")).toBeInTheDocument();
    });

    test("should do nothing when container is clicked but there is no InputItem inside", async () => {
      const user = userEvent.setup();

      render(<Input>{/* No InputItem inside */}</Input>);

      const container = screen.getByRole("presentation");

      const rafSpy = jest.spyOn(globalThis, "requestAnimationFrame");

      await user.click(container);

      expect(rafSpy).not.toHaveBeenCalled();

      rafSpy.mockRestore();
    });
  });
});
