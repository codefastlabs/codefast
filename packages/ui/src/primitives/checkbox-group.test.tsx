import { axe } from 'jest-axe';
import { createRef } from 'react';

import { CheckboxGroup, CheckboxGroupIndicator, CheckboxGroupItem } from '@/primitives/checkbox-group';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('checkbox-group', () => {
  describe('CheckboxGroup component', () => {
    describe('API component', () => {
      test('renders with default props', () => {
        render(
          <CheckboxGroup data-testid="checkbox-group">
            <CheckboxGroupItem value="item1">item1</CheckboxGroupItem>
            <CheckboxGroupItem value="item2">item2</CheckboxGroupItem>
          </CheckboxGroup>,
        );

        expect(screen.getByTestId('checkbox-group')).toBeInTheDocument();
        expect(screen.getAllByRole('checkbox')).toHaveLength(2);
      });

      test('forwards ref to the DOM element', () => {
        const ref = createRef<HTMLDivElement>();

        render(<CheckboxGroup ref={ref} />);
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
      });

      test('supports custom className', () => {
        render(<CheckboxGroup className="custom-class" data-testid="group" />);
        expect(screen.getByTestId('group')).toHaveClass('custom-class');
      });

      test('adds the right ARIA attributes', () => {
        render(
          <CheckboxGroup aria-label="Options" data-testid="group">
            <CheckboxGroupItem value="item1" />
          </CheckboxGroup>,
        );
        expect(screen.getByTestId('group')).toHaveAttribute('aria-label', 'Options');
        expect(screen.getByRole('checkbox')).toBeInTheDocument();
      });

      test('passes other HTML attributes to the underlying DOM element', () => {
        render(<CheckboxGroup data-foo="bar" data-testid="group" />);
        expect(screen.getByTestId('group')).toHaveAttribute('data-foo', 'bar');
      });
    });

    describe('Controlled mode', () => {
      test('controls checked state externally with `value` prop', () => {
        const { rerender } = render(
          <CheckboxGroup value={['item1']}>
            <CheckboxGroupItem value="item1">item1</CheckboxGroupItem>
            <CheckboxGroupItem value="item2">item2</CheckboxGroupItem>
          </CheckboxGroup>,
        );

        expect(screen.getByRole('checkbox', { name: /item1/i })).toBeChecked();
        expect(screen.getByRole('checkbox', { name: /item2/i })).not.toBeChecked();

        // Update the value prop
        rerender(
          <CheckboxGroup value={['item1', 'item2']}>
            <CheckboxGroupItem value="item1">item1</CheckboxGroupItem>
            <CheckboxGroupItem value="item2">item2</CheckboxGroupItem>
          </CheckboxGroup>,
        );

        expect(screen.getByRole('checkbox', { name: /item1/i })).toBeChecked();
        expect(screen.getByRole('checkbox', { name: /item2/i })).toBeChecked();
      });

      test('fires `onValueChange` when checkbox is toggled', async () => {
        const user = userEvent.setup();
        const onValueChange = jest.fn();

        render(
          <CheckboxGroup defaultValue={['item1']} onValueChange={onValueChange}>
            <CheckboxGroupItem value="item1">item1</CheckboxGroupItem>
            <CheckboxGroupItem value="item2">item2</CheckboxGroupItem>
          </CheckboxGroup>,
        );

        // Check item2
        await user.click(screen.getByRole('checkbox', { name: /item2/i }));
        expect(onValueChange).toHaveBeenCalledWith(['item1', 'item2']);

        // Uncheck item1
        await user.click(screen.getByRole('checkbox', { name: /item1/i }));
        expect(onValueChange).toHaveBeenCalledWith(['item2']);
      });
    });

    describe('Uncontrolled mode', () => {
      test('initializes with `defaultValue` prop', () => {
        render(
          <CheckboxGroup defaultValue={['item1']}>
            <CheckboxGroupItem value="item1">item1</CheckboxGroupItem>
            <CheckboxGroupItem value="item2">item2</CheckboxGroupItem>
          </CheckboxGroup>,
        );

        expect(screen.getByRole('checkbox', { name: /item1/i })).toBeChecked();
        expect(screen.getByRole('checkbox', { name: /item2/i })).not.toBeChecked();
      });

      test('manages state internally when no `value` prop is provided', async () => {
        const user = userEvent.setup();

        render(
          <CheckboxGroup defaultValue={['item1']}>
            <CheckboxGroupItem value="item1">item1</CheckboxGroupItem>
            <CheckboxGroupItem value="item2">item2</CheckboxGroupItem>
          </CheckboxGroup>,
        );

        // Toggle item2
        await user.click(screen.getByRole('checkbox', { name: /item2/i }));
        expect(screen.getByRole('checkbox', { name: /item2/i })).toBeChecked();

        // Toggle item1
        await user.click(screen.getByRole('checkbox', { name: /item1/i }));
        expect(screen.getByRole('checkbox', { name: /item1/i })).not.toBeChecked();
        expect(screen.getByRole('checkbox', { name: /item2/i })).toBeChecked();
      });
    });

    describe('Disabled state', () => {
      test('disables all checkboxes when CheckboxGroup is disabled', () => {
        render(
          <CheckboxGroup disabled>
            <CheckboxGroupItem value="item1">item1</CheckboxGroupItem>
            <CheckboxGroupItem value="item2">item2</CheckboxGroupItem>
          </CheckboxGroup>,
        );

        expect(screen.getByRole('checkbox', { name: /item1/i })).toBeDisabled();
        expect(screen.getByRole('checkbox', { name: /item2/i })).toBeDisabled();
      });

      test('individual checkboxes can be disabled independently', () => {
        render(
          <CheckboxGroup>
            <CheckboxGroupItem disabled value="item1" />
            <CheckboxGroupItem value="item2" />
          </CheckboxGroup>,
        );

        expect(screen.getByRole('checkbox', { name: /item1/i })).toBeDisabled();
        expect(screen.getByRole('checkbox', { name: /item2/i })).not.toBeDisabled();
      });

      test('disabled checkboxes cannot be checked', async () => {
        const user = userEvent.setup();
        const onValueChange = jest.fn();

        render(
          <CheckboxGroup defaultValue={[]} onValueChange={onValueChange}>
            <CheckboxGroupItem disabled value="item1" />
            <CheckboxGroupItem value="item2" />
          </CheckboxGroup>,
        );

        // Try to check the disabled checkbox
        await user.click(screen.getByRole('checkbox', { name: /item1/i }));
        expect(onValueChange).not.toHaveBeenCalled();

        // Check enabled checkbox
        await user.click(screen.getByRole('checkbox', { name: /item2/i }));
        expect(onValueChange).toHaveBeenCalledWith(['item2']);
      });
    });

    describe('Required state', () => {
      test('prevents unchecking the last checked item when required is true', async () => {
        const user = userEvent.setup();
        const onValueChange = jest.fn();

        const { rerender } = render(
          <CheckboxGroup required value={['item1']} onValueChange={onValueChange}>
            <CheckboxGroupItem value="item1">item1</CheckboxGroupItem>
            <CheckboxGroupItem value="item2">item2</CheckboxGroupItem>
          </CheckboxGroup>,
        );

        // Try to uncheck the only checked item
        await user.click(screen.getByRole('checkbox', { name: /item1/i }));
        expect(onValueChange).not.toHaveBeenCalled();

        // Check another item first
        await user.click(screen.getByRole('checkbox', { name: /item2/i }));
        expect(onValueChange).toHaveBeenCalledWith(['item1', 'item2']);
        onValueChange.mockReset();

        // Update the value to reflect both items being checked - using rerender
        rerender(
          <CheckboxGroup required value={['item1', 'item2']} onValueChange={onValueChange}>
            <CheckboxGroupItem value="item1">item1</CheckboxGroupItem>
            <CheckboxGroupItem value="item2">item2</CheckboxGroupItem>
          </CheckboxGroup>,
        );

        // Now we can uncheck item1 because item2 is checked
        await user.click(screen.getByRole('checkbox', { name: /item1/i }));
        expect(onValueChange).toHaveBeenCalledWith(['item2']);
      });
    });
  });

  describe('CheckboxGroupItem component', () => {
    describe('API component', () => {
      test('renders with default props inside CheckboxGroup', () => {
        render(
          <CheckboxGroup>
            <CheckboxGroupItem data-testid="checkbox-item" value="item1" />
          </CheckboxGroup>,
        );

        expect(screen.getByTestId('checkbox-item')).toBeInTheDocument();
        expect(screen.getByRole('checkbox')).not.toBeChecked();
      });

      test('forwards ref to the DOM element', () => {
        const ref = createRef<HTMLButtonElement>();

        render(
          <CheckboxGroup>
            <CheckboxGroupItem ref={ref} value="item1" />
          </CheckboxGroup>,
        );
        expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      });

      test('supports custom className', () => {
        render(
          <CheckboxGroup>
            <CheckboxGroupItem className="custom-class" data-testid="item" value="item1" />
          </CheckboxGroup>,
        );
        expect(screen.getByTestId('item')).toHaveClass('custom-class');
      });

      test('adds the right ARIA attributes', () => {
        render(
          <CheckboxGroup>
            <CheckboxGroupItem aria-label="Option 1" value="item1" />
          </CheckboxGroup>,
        );
        expect(screen.getByRole('checkbox')).toHaveAttribute('aria-label', 'Option 1');
        expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'false');
      });
    });

    describe('Value handling', () => {
      test('becomes checked when its value is included in CheckboxGroup value', () => {
        render(
          <CheckboxGroup value={['item1', 'item3']}>
            <CheckboxGroupItem data-testid="item1" value="item1" />
            <CheckboxGroupItem data-testid="item2" value="item2" />
            <CheckboxGroupItem data-testid="item3" value="item3" />
          </CheckboxGroup>,
        );

        expect(screen.getByTestId('item1')).toHaveAttribute('aria-checked', 'true');
        expect(screen.getByTestId('item2')).toHaveAttribute('aria-checked', 'false');
        expect(screen.getByTestId('item3')).toHaveAttribute('aria-checked', 'true');
      });

      test('changes state on click', async () => {
        const user = userEvent.setup();
        const onValueChange = jest.fn();

        render(
          <CheckboxGroup value={[]} onValueChange={onValueChange}>
            <CheckboxGroupItem value="item1" />
          </CheckboxGroup>,
        );

        await user.click(screen.getByRole('checkbox'));
        expect(onValueChange).toHaveBeenCalledWith(['item1']);
      });
    });
  });

  describe('CheckboxGroupIndicator component', () => {
    test('renders only when parent CheckboxGroupItem is checked', () => {
      const { rerender } = render(
        <CheckboxGroup value={[]}>
          <CheckboxGroupItem value="item1">
            <CheckboxGroupIndicator data-testid="indicator">✓</CheckboxGroupIndicator>
          </CheckboxGroupItem>
        </CheckboxGroup>,
      );

      // Indicator should not be in the DOM when unchecked
      expect(screen.queryByTestId('indicator')).not.toBeInTheDocument();

      // Update to checked state
      rerender(
        <CheckboxGroup value={['item1']}>
          <CheckboxGroupItem value="item1">
            <CheckboxGroupIndicator data-testid="indicator">✓</CheckboxGroupIndicator>
          </CheckboxGroupItem>
        </CheckboxGroup>,
      );

      // Indicator should now be in the DOM
      expect(screen.getByTestId('indicator')).toBeInTheDocument();
      expect(screen.getByTestId('indicator')).toHaveTextContent('✓');
    });

    test('forwards ref to the DOM element', () => {
      const ref = createRef<HTMLDivElement>();

      render(
        <CheckboxGroup value={['item1']}>
          <CheckboxGroupItem value="item1">
            <CheckboxGroupIndicator ref={ref}>✓</CheckboxGroupIndicator>
          </CheckboxGroupItem>
        </CheckboxGroup>,
      );
      expect(ref.current).toBeInstanceOf(HTMLSpanElement);
    });

    test('supports custom className', () => {
      render(
        <CheckboxGroup value={['item1']}>
          <CheckboxGroupItem value="item1">
            <CheckboxGroupIndicator className="custom-indicator" data-testid="indicator">
              ✓
            </CheckboxGroupIndicator>
          </CheckboxGroupItem>
        </CheckboxGroup>,
      );

      expect(screen.getByTestId('indicator')).toHaveClass('custom-indicator');
    });
  });

  describe('Keyboard navigation', () => {
    test('supports horizontal navigation', async () => {
      const user = userEvent.setup();

      render(
        <CheckboxGroup orientation="horizontal">
          <CheckboxGroupItem data-testid="item1" value="item1" />
          <CheckboxGroupItem data-testid="item2" value="item2" />
          <CheckboxGroupItem data-testid="item3" value="item3" />
        </CheckboxGroup>,
      );

      // Focus the first checkbox
      act(() => {
        screen.getByTestId('item1').focus();
      });

      expect(screen.getByTestId('item1')).toHaveFocus();

      // Move focus to the right with an arrow key
      await user.keyboard('{ArrowRight}');
      expect(screen.getByTestId('item2')).toHaveFocus();

      // Move focus to the right again
      await user.keyboard('{ArrowRight}');
      expect(screen.getByTestId('item3')).toHaveFocus();

      // Loop back to the first checkbox
      await user.keyboard('{ArrowRight}');
      expect(screen.getByTestId('item1')).toHaveFocus();

      // Move focus to the left
      await user.keyboard('{ArrowLeft}');
      expect(screen.getByTestId('item3')).toHaveFocus();
    });

    test('supports vertical navigation', async () => {
      const user = userEvent.setup();

      render(
        <CheckboxGroup orientation="vertical">
          <CheckboxGroupItem data-testid="item1" value="item1" />
          <CheckboxGroupItem data-testid="item2" value="item2" />
          <CheckboxGroupItem data-testid="item3" value="item3" />
        </CheckboxGroup>,
      );

      // Focus the first checkbox
      act(() => {
        screen.getByTestId('item1').focus();
      });
      expect(screen.getByTestId('item1')).toHaveFocus();

      // Move focus down with an arrow key
      await user.keyboard('{ArrowDown}');
      expect(screen.getByTestId('item2')).toHaveFocus();

      // Move focus down again
      await user.keyboard('{ArrowDown}');
      expect(screen.getByTestId('item3')).toHaveFocus();

      // Loop back to the first checkbox
      await user.keyboard('{ArrowDown}');
      expect(screen.getByTestId('item1')).toHaveFocus();

      // Move focus up
      await user.keyboard('{ArrowUp}');
      expect(screen.getByTestId('item3')).toHaveFocus();
    });

    test('disables loop behavior when loop prop is false', async () => {
      const user = userEvent.setup();

      render(
        <CheckboxGroup loop={false} orientation="horizontal">
          <CheckboxGroupItem data-testid="item1" value="item1" />
          <CheckboxGroupItem data-testid="item2" value="item2" />
          <CheckboxGroupItem data-testid="item3" value="item3" />
        </CheckboxGroup>,
      );

      // Focus the first checkbox
      act(() => {
        screen.getByTestId('item1').focus();
      });
      expect(screen.getByTestId('item1')).toHaveFocus();

      // Try to move left (should not change because loop is false)
      await user.keyboard('{ArrowLeft}');
      expect(screen.getByTestId('item1')).toHaveFocus();

      // Move to the last item
      act(() => {
        screen.getByTestId('item3').focus();
      });
      expect(screen.getByTestId('item3')).toHaveFocus();

      // Try to move right (should not change because loop is false)
      await user.keyboard('{ArrowRight}');
      expect(screen.getByTestId('item3')).toHaveFocus();
    });

    test('toggles item with Space key', async () => {
      const user = userEvent.setup();
      const onValueChange = jest.fn();

      render(
        <CheckboxGroup value={[]} onValueChange={onValueChange}>
          <CheckboxGroupItem data-testid="item1" value="item1" />
        </CheckboxGroup>,
      );

      // Focus the checkbox
      act(() => {
        screen.getByTestId('item1').focus();
      });

      // Press Space to check it
      await user.keyboard(' ');
      expect(onValueChange).toHaveBeenCalledWith(['item1']);
    });
  });

  describe('Accessibility', () => {
    test('has no accessibility violations', async () => {
      const { container } = render(
        <CheckboxGroup aria-label="Group options">
          <CheckboxGroupItem aria-label="Option 1" value="item1" />
          <CheckboxGroupItem aria-label="Option 2" value="item2" />
          <CheckboxGroupItem disabled aria-label="Option 3" value="item3" />
        </CheckboxGroup>,
      );

      const results = await axe(container);

      expect(results).toHaveNoViolations();
    });

    test('maintains proper tab order', async () => {
      const user = userEvent.setup();

      render(
        <>
          <button data-testid="before" type="button">
            Before
          </button>
          <CheckboxGroup>
            <CheckboxGroupItem data-testid="item1" value="item1" />
            <CheckboxGroupItem data-testid="item2" value="item2" />
          </CheckboxGroup>
          <button data-testid="after" type="button">
            After
          </button>
        </>,
      );

      // Start by focusing on the button before
      act(() => {
        screen.getByTestId('before').focus();
      });

      // Tab should move to the first checkbox
      await user.tab();
      expect(screen.getByTestId('item1')).toHaveFocus();

      // Tab should skip other checkboxes and go directly to the next focusable element
      await user.tab();
      expect(screen.getByTestId('after')).toHaveFocus();
    });

    test('sets appropriate aria attributes for required checkboxes', () => {
      render(
        <CheckboxGroup required>
          <CheckboxGroupItem data-testid="item1" value="item1" />
        </CheckboxGroup>,
      );

      // Should have aria-required attribute
      expect(screen.getByTestId('item1')).toHaveAttribute('aria-required', 'true');
    });
  });

  describe('Edge cases', () => {
    test('handles empty value array properly', () => {
      render(
        <CheckboxGroup value={[]}>
          <CheckboxGroupItem data-testid="item1" value="item1" />
        </CheckboxGroup>,
      );

      expect(screen.getByTestId('item1')).toHaveAttribute('aria-checked', 'false');
    });

    test('handles null/undefined value gracefully', () => {
      render(
        // @ts-expect-error - Allowing null value for testing error handling
        <CheckboxGroup value={null}>
          <CheckboxGroupItem data-testid="item1" value="item1" />
        </CheckboxGroup>,
      );

      expect(screen.getByTestId('item1')).toHaveAttribute('aria-checked', 'false');
    });

    test('handles duplicate values correctly', () => {
      const onValueChange = jest.fn();

      render(
        <CheckboxGroup value={['item1']} onValueChange={onValueChange}>
          <CheckboxGroupItem data-testid="item1-first" value="item1" />
          <CheckboxGroupItem data-testid="item1-second" value="item1" />
        </CheckboxGroup>,
      );

      // Both checkboxes with the same value should be checked
      expect(screen.getByTestId('item1-first')).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByTestId('item1-second')).toHaveAttribute('aria-checked', 'true');
    });
  });
});
