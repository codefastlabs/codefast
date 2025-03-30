import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import { Input, InputItem } from '@/input';

describe('input', () => {
  // Render tests
  describe('Rendering', () => {
    it('should render Input with InputItem correctly', () => {
      render(
        <Input>
          <InputItem placeholder="Enter text" />
        </Input>,
      );

      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('should render with prefix and suffix', () => {
      render(
        <Input prefix={<div data-testid="prefix">Prefix</div>} suffix={<div data-testid="suffix">Suffix</div>}>
          <InputItem />
        </Input>,
      );

      expect(screen.getByTestId('prefix')).toBeInTheDocument();
      expect(screen.getByTestId('suffix')).toBeInTheDocument();
    });

    it('should render loading spinner in prefix position by default', () => {
      render(
        <Input loading spinner={<div data-testid="spinner">Loading...</div>}>
          <InputItem />
        </Input>,
      );

      expect(screen.getByTestId('spinner')).toBeInTheDocument();
    });

    it('should render loading spinner in suffix position when specified', () => {
      render(
        <Input
          loading
          loaderPosition="suffix"
          prefix={<div data-testid="prefix">Prefix</div>}
          spinner={<div data-testid="spinner">Loading...</div>}
        >
          <InputItem />
        </Input>,
      );

      expect(screen.getByTestId('spinner')).toBeInTheDocument();
      expect(screen.getByTestId('prefix')).toBeInTheDocument();
    });
  });

  // Behavior tests
  describe('Behavior', () => {
    it('should focus input when clicking on container', async () => {
      render(
        <Input>
          <InputItem data-testid="input" />
        </Input>,
      );

      const container = screen.getByRole('presentation');
      const input = screen.getByTestId('input');

      // Simulate clicking on the container, not the input
      fireEvent.pointerDown(container);

      // Wait for requestAnimationFrame
      await new Promise((resolve) => {
        requestAnimationFrame(resolve);
      });

      expect(input).toHaveFocus();
    });

    it('should not stop propagation when clicking directly on input', () => {
      const containerClickHandler = jest.fn();
      const inputClickHandler = jest.fn();

      render(
        // @ts-ignore
        <Input onClick={containerClickHandler}>
          <InputItem data-testid="input" onClick={inputClickHandler} />
        </Input>,
      );

      const input = screen.getByTestId('input');

      fireEvent.click(input);

      expect(inputClickHandler).toHaveBeenCalled();
      expect(containerClickHandler).toHaveBeenCalled();
    });

    it('should trigger click on file input when container is clicked', async () => {
      render(
        <Input>
          <InputItem data-testid="file-input" type="file" />
        </Input>,
      );

      const container = screen.getByRole('presentation');
      const fileInput = screen.getByTestId('file-input');
      const clickSpy = jest.spyOn(fileInput, 'click');

      // Mock requestAnimationFrame với type assertion
      const rafSpy = jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => setTimeout(cb, 0));

      fireEvent.pointerDown(container);

      // Wait for our mocked requestAnimationFrame
      await new Promise((resolve) => {
        requestAnimationFrame(resolve);
      });

      expect(clickSpy).toHaveBeenCalled();

      // Clean up mock
      rafSpy.mockRestore();
    });

    it('should prevent focus re-triggering when container is clicked while input is already focused', async () => {
      // Arrange: Render the component and get references to DOM elements
      render(
        <Input>
          <InputItem data-testid="input" />
        </Input>,
      );

      const container = screen.getByRole('presentation');
      const input = screen.getByTestId('input');

      // Set the initial focus state
      input.focus();
      expect(input).toHaveFocus();

      // Create a spy on the input's focus method to verify it's not called again
      const focusSpy = jest.spyOn(input, 'focus');

      // Create a custom pointer event with a spy on preventDefault
      // This allows us to verify the default behavior is prevented when input is already focused
      const mockPreventDefault = jest.fn();
      const pointerEvent = new Event('pointerdown', {
        bubbles: true,
        cancelable: true,
      });

      // Override the preventDefault method with our spy
      Object.defineProperty(pointerEvent, 'preventDefault', {
        value: mockPreventDefault,
      });

      // Act: Dispatch the pointer event on the container
      container.dispatchEvent(pointerEvent);

      // Wait for any requestAnimationFrame callbacks to execute
      await new Promise((resolve) => {
        requestAnimationFrame(resolve);
      });

      // Assert: Verify the expected behavior
      // 1. preventDefault should be called to prevent focus flickering
      expect(mockPreventDefault).toHaveBeenCalled();

      // 2. The focus method should not be called again as input is already focused
      expect(focusSpy).not.toHaveBeenCalled();

      // 3. Input should maintain its focus state
      expect(input).toHaveFocus();
    });
  });

  // Attribute tests
  describe('Attributes', () => {
    it('should apply disabled attribute correctly', () => {
      render(
        <Input disabled>
          <InputItem data-testid="input" />
        </Input>,
      );

      const container = screen.getByRole('presentation');
      const input = screen.getByTestId('input');

      expect(container).toHaveAttribute('data-disabled', 'true');
      expect(input).toBeDisabled();
    });

    it('should apply readOnly attribute correctly', () => {
      render(
        <Input readOnly>
          <InputItem data-testid="input" />
        </Input>,
      );

      const container = screen.getByRole('presentation');
      const input = screen.getByTestId('input');

      expect(container).toHaveAttribute('data-readonly', 'true');
      expect(input).toHaveAttribute('readonly');
    });

    it('should pass additional props to container div', () => {
      render(
        <Input aria-label="test input" data-testid="container">
          <InputItem />
        </Input>,
      );

      const container = screen.getByTestId('container');

      expect(container).toHaveAttribute('aria-label', 'test input');
    });

    it('should pass additional props to input element', () => {
      render(
        <Input>
          <InputItem data-testid="input" maxLength={10} />
        </Input>,
      );

      const input = screen.getByTestId('input');

      expect(input).toHaveAttribute('maxlength', '10');
    });
  });

  // User interaction tests
  describe('User interactions', () => {
    it('should update value when typing', async () => {
      const user = userEvent.setup();

      render(
        <Input>
          <InputItem data-testid="input" />
        </Input>,
      );

      const input = screen.getByTestId('input');

      await user.type(input, 'Hello world');

      expect(input).toHaveValue('Hello world');
    });

    it('should not allow typing when disabled', async () => {
      const user = userEvent.setup();

      render(
        <Input disabled>
          <InputItem data-testid="input" />
        </Input>,
      );

      const input = screen.getByTestId('input');

      await user.type(input, 'Hello world');

      expect(input).toHaveValue(''); // Value should not change
    });

    it('should not allow typing when readOnly', async () => {
      const user = userEvent.setup();

      render(
        <Input readOnly>
          <InputItem data-testid="input" defaultValue="Initial value" />
        </Input>,
      );

      const input = screen.getByTestId('input');

      await user.type(input, 'New value');

      expect(input).toHaveValue('Initial value'); // Value should not change
    });
  });

  // Accessibility tests
  describe('Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <Input>
          <InputItem placeholder="Enter text" />
        </Input>,
      );

      const results = await axe(container);

      expect(results).toHaveNoViolations();
    });

    it('should handle keyboard navigation correctly', async () => {
      const user = userEvent.setup();

      render(
        <div>
          <button data-testid="before" type="button">
            Before
          </button>
          <Input>
            <InputItem data-testid="input" />
          </Input>
          <button data-testid="after" type="button">
            After
          </button>
        </div>,
      );

      const beforeButton = screen.getByTestId('before');
      const input = screen.getByTestId('input');
      const afterButton = screen.getByTestId('after');

      // Focus first button
      beforeButton.focus();
      expect(beforeButton).toHaveFocus();

      // Tab to input
      await user.tab();
      expect(input).toHaveFocus();

      // Tab to the next button
      await user.tab();
      expect(afterButton).toHaveFocus();
    });
  });

  // Edge cases
  describe('Edge cases', () => {
    it('should handle nested clickable elements correctly', () => {
      const linkClickHandler = jest.fn();

      render(
        <Input
          prefix={
            <a data-testid="link" href="#" onClick={linkClickHandler}>
              Click me
            </a>
          }
        >
          <InputItem data-testid="input" />
        </Input>,
      );

      const link = screen.getByTestId('link');
      const input = screen.getByTestId('input');

      // Click on the link
      fireEvent.pointerDown(link);

      // The handler should be called and the event should not be stopped
      expect(linkClickHandler).not.toHaveBeenCalled(); // pointerDown doesn't trigger onClick
      expect(input).not.toHaveFocus();
    });

    it('should work without InputItem', () => {
      render(
        <Input data-testid="container">
          <div data-testid="custom-content">Custom content</div>
        </Input>,
      );

      expect(screen.getByTestId('container')).toBeInTheDocument();
      expect(screen.getByTestId('custom-content')).toBeInTheDocument();
    });

    it('should handle multiple InputItems correctly', () => {
      render(
        <Input>
          <InputItem data-testid="input1" />
          <InputItem data-testid="input2" />
        </Input>,
      );

      expect(screen.getByTestId('input1')).toBeInTheDocument();
      expect(screen.getByTestId('input2')).toBeInTheDocument();
    });
  });
});
