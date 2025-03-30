import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import { InputNumber, InputNumberDecrementButton, InputNumberIncrementButton, InputNumberItem } from '@/input-number';

describe('input-number', () => {
  // Main InputNumber component tests
  describe('InputNumber', () => {
    // Test basic structure
    test('renders correct structure', () => {
      render(
        <InputNumber data-testid="input-number">
          <InputNumberDecrementButton data-testid="decrement-btn">-</InputNumberDecrementButton>
          <InputNumberItem data-testid="input-item" />
          <InputNumberIncrementButton data-testid="increment-btn">+</InputNumberIncrementButton>
        </InputNumber>,
      );

      expect(screen.getByTestId('input-number')).toBeInTheDocument();
      expect(screen.getByTestId('decrement-btn')).toBeInTheDocument();
      expect(screen.getByTestId('input-item')).toBeInTheDocument();
      expect(screen.getByTestId('increment-btn')).toBeInTheDocument();
    });

    // Test uncontrolled state with defaultValue
    test('works in uncontrolled mode with defaultValue', async () => {
      render(
        <InputNumber data-testid="input-number" defaultValue={10}>
          <InputNumberDecrementButton data-testid="decrement-btn">-</InputNumberDecrementButton>
          <InputNumberItem data-testid="input-item" />
          <InputNumberIncrementButton data-testid="increment-btn">+</InputNumberIncrementButton>
        </InputNumber>,
      );

      const input = screen.getByTestId('input-item');

      expect(input).toHaveValue('10');

      await userEvent.click(screen.getByTestId('increment-btn'));
      expect(input).toHaveValue('11');

      await userEvent.click(screen.getByTestId('decrement-btn'));
      expect(input).toHaveValue('10');
    });

    // Test controlled state
    test('works in controlled mode', async () => {
      const handleChange = jest.fn();

      const { rerender } = render(
        <InputNumber data-testid="input-number" value={10} onChange={handleChange}>
          <InputNumberDecrementButton data-testid="decrement-btn">-</InputNumberDecrementButton>
          <InputNumberItem data-testid="input-item" />
          <InputNumberIncrementButton data-testid="increment-btn">+</InputNumberIncrementButton>
        </InputNumber>,
      );

      const input = screen.getByTestId('input-item');

      expect(input).toHaveValue('10');

      await userEvent.click(screen.getByTestId('increment-btn'));

      // Check that onChange is called with the new value
      expect(handleChange).toHaveBeenCalledWith(11);

      // Since InputNumber uses useControllableState internally,
      // it updates the UI immediately while still calling onChange
      expect(input).toHaveValue('11');

      // Even though the component updates the UI, we should still
      // test that it responds to external value changes
      rerender(
        <InputNumber data-testid="input-number" value={12} onChange={handleChange}>
          <InputNumberDecrementButton data-testid="decrement-btn">-</InputNumberDecrementButton>
          <InputNumberItem data-testid="input-item" />
          <InputNumberIncrementButton data-testid="increment-btn">+</InputNumberIncrementButton>
        </InputNumber>,
      );

      // Input value is updated according to the new external value prop
      expect(input).toHaveValue('12');
    });

    // Test min/max constraints
    test('respects min/max constraints', async () => {
      render(
        <InputNumber data-testid="input-number" defaultValue={5} max={10} min={0}>
          <InputNumberDecrementButton data-testid="decrement-btn">-</InputNumberDecrementButton>
          <InputNumberItem data-testid="input-item" />
          <InputNumberIncrementButton data-testid="increment-btn">+</InputNumberIncrementButton>
        </InputNumber>,
      );

      const input = screen.getByTestId('input-item');
      const incrementBtn = screen.getByTestId('increment-btn');
      const decrementBtn = screen.getByTestId('decrement-btn');

      // Increment to max
      for (let i = 0; i < 10; i++) {
        await userEvent.click(incrementBtn);
      }

      expect(input).toHaveValue('10');
      await userEvent.click(incrementBtn);
      expect(input).toHaveValue('10'); // Still 10 because we reached max

      // Decrement to min
      for (let i = 0; i < 15; i++) {
        await userEvent.click(decrementBtn);
      }

      expect(input).toHaveValue('0');
      await userEvent.click(decrementBtn);
      expect(input).toHaveValue('0'); // Still 0 because we reached min
    });

    // Test step size
    test('applies step size correctly', async () => {
      render(
        <InputNumber data-testid="input-number" defaultValue={5} step={2.5}>
          <InputNumberDecrementButton data-testid="decrement-btn">-</InputNumberDecrementButton>
          <InputNumberItem data-testid="input-item" />
          <InputNumberIncrementButton data-testid="increment-btn">+</InputNumberIncrementButton>
        </InputNumber>,
      );

      const input = screen.getByTestId('input-item');

      await userEvent.click(screen.getByTestId('increment-btn'));
      expect(input).toHaveValue('7.5');

      await userEvent.click(screen.getByTestId('decrement-btn'));
      expect(input).toHaveValue('5');
    });

    // Test format options
    test('formats numbers according to formatOptions', () => {
      render(
        <InputNumber
          data-testid="input-number"
          defaultValue={1234.5}
          formatOptions={{ style: 'currency', currency: 'USD' }}
        >
          <InputNumberItem data-testid="input-item" />
        </InputNumber>,
      );

      const input = screen.getByTestId('input-item');

      expect(input).toHaveValue('$1,234.50');
    });

    // Test disabled state
    test('disables all interactions when disabled', async () => {
      render(
        <InputNumber disabled data-testid="input-number" defaultValue={5}>
          <InputNumberDecrementButton data-testid="decrement-btn">-</InputNumberDecrementButton>
          <InputNumberItem data-testid="input-item" />
          <InputNumberIncrementButton data-testid="increment-btn">+</InputNumberIncrementButton>
        </InputNumber>,
      );

      const input = screen.getByTestId('input-item');

      expect(input).toBeDisabled();

      const incrementBtn = screen.getByTestId('increment-btn');
      const decrementBtn = screen.getByTestId('decrement-btn');

      expect(incrementBtn).toBeDisabled();
      expect(decrementBtn).toBeDisabled();

      await userEvent.click(incrementBtn);
      expect(input).toHaveValue('5'); // No change because disabled
    });

    // Accessibility testing
    test('has no accessibility violations', async () => {
      const { container } = render(
        <div>
          <label htmlFor="number-input">Number Input</label>
          <InputNumber data-testid="input-number" defaultValue={5} id="number-input">
            <InputNumberDecrementButton data-testid="decrement-btn">-</InputNumberDecrementButton>
            <InputNumberItem aria-labelledby="number-label" data-testid="input-item" />
            <InputNumberIncrementButton data-testid="increment-btn">+</InputNumberIncrementButton>
          </InputNumber>
        </div>,
      );

      const results = await axe(container);

      expect(results).toHaveNoViolations();
    });

    // Test prop forwarding
    test('passes id to InputNumberItem', () => {
      render(
        <InputNumber data-testid="input-number" id="test-id">
          <InputNumberDecrementButton data-testid="decrement-btn">-</InputNumberDecrementButton>
          <InputNumberItem data-testid="input-item" />
          <InputNumberIncrementButton data-testid="increment-btn">+</InputNumberIncrementButton>
        </InputNumber>,
      );

      const input = screen.getByTestId('input-item');

      expect(input).toHaveAttribute('id', 'test-id');
    });
  });

  // InputNumberItem component tests
  describe('InputNumberItem', () => {
    // Test direct user input handling
    test('handles direct user input', async () => {
      const handleChange = jest.fn();

      render(
        <InputNumber defaultValue={10} onChange={handleChange}>
          <InputNumberItem data-testid="input-item" />
        </InputNumber>,
      );

      const input = screen.getByTestId('input-item');

      // Clear current value
      await userEvent.clear(input);
      // Type a new value
      await userEvent.type(input, '42');
      // Trigger blur event to validate and commit the input value
      // This is required as the onChange callback may only be invoked after the input loses focus, not on every keystroke
      fireEvent.blur(input);

      expect(input).toHaveValue('42');
      expect(handleChange).toHaveBeenCalledWith(42);
    });

    // Test validation and formatting on blur event
    test('validates and formats on blur', async () => {
      render(
        <InputNumber defaultValue={5} max={100} min={0}>
          <InputNumberItem data-testid="input-item" />
        </InputNumber>,
      );

      const input = screen.getByTestId('input-item');

      // Simulate entering value above max
      await userEvent.clear(input);
      await userEvent.type(input, '200');
      fireEvent.blur(input);

      // Check if the value is adjusted to max
      expect(input).toHaveValue('100');

      // Simulate entering value below min
      await userEvent.clear(input);
      await userEvent.type(input, '-10');
      fireEvent.blur(input);

      // Check if the value is adjusted to min
      expect(input).toHaveValue('0');
    });

    // Test keyboard navigation
    test('handles keyboard navigation', () => {
      const handleChange = jest.fn();

      render(
        <InputNumber defaultValue={10} onChange={handleChange}>
          <InputNumberItem data-testid="input-item" />
        </InputNumber>,
      );

      const input = screen.getByTestId('input-item');

      // Press arrow up to increment
      fireEvent.keyDown(input, { key: 'ArrowUp' });
      expect(handleChange).toHaveBeenCalledWith(11);

      // Press arrow down to decrement
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      expect(handleChange).toHaveBeenCalledWith(10);

      // Home key should set to min (assuming no min is specified)
      fireEvent.keyDown(input, { key: 'Home' });

      // End key should set to max (assuming no max is specified)
      fireEvent.keyDown(input, { key: 'End' });
    });
  });

  // InputNumberDecrementButton component tests
  describe('InputNumberDecrementButton', () => {
    // Test basic decrement functionality
    test('decreases value when clicked', async () => {
      render(
        <InputNumber defaultValue={10}>
          <InputNumberDecrementButton data-testid="decrement-btn">-</InputNumberDecrementButton>
          <InputNumberItem data-testid="input-item" />
        </InputNumber>,
      );

      const button = screen.getByTestId('decrement-btn');
      const input = screen.getByTestId('input-item');

      await userEvent.click(button);
      expect(input).toHaveValue('9');

      await userEvent.click(button);
      expect(input).toHaveValue('8');
    });

    // Test disabled state at minimum value
    test('becomes disabled at minimum value', () => {
      render(
        <InputNumber defaultValue={1} min={1}>
          <InputNumberDecrementButton data-testid="decrement-btn">-</InputNumberDecrementButton>
          <InputNumberItem data-testid="input-item" />
        </InputNumber>,
      );

      const button = screen.getByTestId('decrement-btn');

      expect(button).toBeDisabled();
    });

    // Test custom rendering
    test('supports custom rendering', () => {
      render(
        <InputNumber defaultValue={10}>
          <InputNumberDecrementButton data-testid="decrement-btn">
            <span>Decrease</span>
          </InputNumberDecrementButton>
          <InputNumberItem />
        </InputNumber>,
      );

      expect(screen.getByText('Decrease')).toBeInTheDocument();
    });
  });

  // InputNumberIncrementButton component tests
  describe('InputNumberIncrementButton', () => {
    // Test basic increment functionality
    test('increases value when clicked', async () => {
      render(
        <InputNumber defaultValue={10}>
          <InputNumberItem data-testid="input-item" />
          <InputNumberIncrementButton data-testid="increment-btn">+</InputNumberIncrementButton>
        </InputNumber>,
      );

      const button = screen.getByTestId('increment-btn');
      const input = screen.getByTestId('input-item');

      await userEvent.click(button);
      expect(input).toHaveValue('11');

      await userEvent.click(button);
      expect(input).toHaveValue('12');
    });

    // Test disabled state at maximum value
    test('becomes disabled at maximum value', () => {
      render(
        <InputNumber defaultValue={100} max={100}>
          <InputNumberItem />
          <InputNumberIncrementButton data-testid="increment-btn">+</InputNumberIncrementButton>
        </InputNumber>,
      );

      const button = screen.getByTestId('increment-btn');

      expect(button).toBeDisabled();
    });

    // Test custom rendering
    test('supports custom rendering', () => {
      render(
        <InputNumber defaultValue={10}>
          <InputNumberItem />
          <InputNumberIncrementButton data-testid="increment-btn">
            <span>Increase</span>
          </InputNumberIncrementButton>
        </InputNumber>,
      );

      expect(screen.getByText('Increase')).toBeInTheDocument();
    });
  });

  // Integration tests for the whole component
  describe('InputNumber Integration Tests', () => {
    // Test all components working together
    test('works together as a complete component', async () => {
      const handleChange = jest.fn();

      render(
        <InputNumber data-testid="number-input" defaultValue={50} max={100} min={0} step={5} onChange={handleChange}>
          <InputNumberDecrementButton data-testid="decrement">-</InputNumberDecrementButton>
          <InputNumberItem data-testid="input" />
          <InputNumberIncrementButton data-testid="increment">+</InputNumberIncrementButton>
        </InputNumber>,
      );

      const input = screen.getByTestId('input');
      const decrementBtn = screen.getByTestId('decrement');
      const incrementBtn = screen.getByTestId('increment');

      // Check the initial value
      expect(input).toHaveValue('50');

      // Increase value with a button
      await userEvent.click(incrementBtn);
      expect(input).toHaveValue('55');
      expect(handleChange).toHaveBeenCalledWith(55);

      // Decrease value with a button
      await userEvent.click(decrementBtn);
      expect(input).toHaveValue('50');
      expect(handleChange).toHaveBeenCalledWith(50);

      // Direct input
      await userEvent.clear(input);
      await userEvent.type(input, '75');
      fireEvent.blur(input);
      expect(handleChange).toHaveBeenCalledWith(75);
      expect(input).toHaveValue('75');

      // Exceed max limit
      await userEvent.clear(input);
      await userEvent.type(input, '150');
      expect(input).toHaveValue('150'); // Value not yet validated

      // Below min when blur
      await userEvent.clear(input);
      await userEvent.type(input, '-20');
      expect(input).toHaveValue('-20'); // Value not yet validated before blur
    });

    // Test format options and locale together
    test('properly applies formatting and locale', () => {
      render(
        <InputNumber
          data-testid="number-input"
          defaultValue={1234.56}
          formatOptions={{ style: 'currency', currency: 'EUR' }}
          locale="de-DE"
        >
          <InputNumberDecrementButton data-testid="decrement">-</InputNumberDecrementButton>
          <InputNumberItem data-testid="input" />
          <InputNumberIncrementButton data-testid="increment">+</InputNumberIncrementButton>
        </InputNumber>,
      );

      const input = screen.getByTestId('input');

      // Check if formatting is applied
      // In German locale, it should use comma as a decimal separator and show Euro symbol
      expect(input).toHaveValue('1.234,56\u00A0€');
    });

    // Test handling of invalid user input
    test('handles invalid user input gracefully', async () => {
      const handleChange = jest.fn();

      render(
        <InputNumber data-testid="number-input" defaultValue={50} onChange={handleChange}>
          <InputNumberItem data-testid="input" />
        </InputNumber>,
      );

      const input = screen.getByTestId('input');

      // Test entering non-numeric text
      await userEvent.type(input, 'abc');

      // Should not call onChange for invalid input
      expect(handleChange).not.toHaveBeenCalledWith(Number.NaN);

      // On blur, should restore to the previous valid value
      fireEvent.blur(input);
      expect(input).toHaveValue('50');
    });
  });
});
