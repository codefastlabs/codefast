import { tv } from '@/index';

describe('Tailwind Variants (TV) - Configuration Edge Cases', () => {
  test('should handle extends with undefined base variants', () => {
    const baseComponent = tv({
      base: 'flex',
      variants: {
        size: {
          md: 'text-lg',
          sm: 'text-sm',
        },
      },
    });

    const extendedComponent = tv({
      extend: baseComponent,
      variants: {
        color: {
          blue: 'text-blue-500',
          red: 'text-red-500',
        },
        // Adding a new variant that doesn't exist in base
        newVariant: {
          option1: 'bg-gray-100',
          option2: 'bg-gray-200',
        },
      },
    });

    const result = extendedComponent({ color: 'red', newVariant: 'option1', size: 'sm' });

    expect(result).toHaveClassName(['flex', 'text-sm', 'text-red-500', 'bg-gray-100']);
  });

  test('should handle extends with slot object merging', () => {
    const baseComponent = tv({
      slots: {
        base: 'flex',
        item: 'px-2',
      },
      variants: {
        size: {
          md: {
            base: 'p-4',
            item: 'text-base',
          },
          sm: {
            base: 'p-2',
            item: 'text-sm',
          },
        },
      },
    });

    const extendedComponent = tv({
      extend: baseComponent,
      variants: {
        color: {
          red: {
            base: 'bg-red-500',
            item: 'text-red-500',
          },
        },
        size: {
          // Add a new size variant
          lg: {
            base: 'p-6',
            item: 'text-lg',
          },
          sm: {
            // Should merge with an existing slot object
            base: 'p-1',
            // item should remain from base
          },
        },
      },
    });

    const { base: smBase, item: smItem } = extendedComponent({ size: 'sm' });

    expect(smBase()).toHaveClassName(['flex', 'p-1']);
    expect(smItem()).toHaveClassName(['px-2', 'text-sm']);

    const { base: lgBase, item: lgItem } = extendedComponent({ size: 'lg' });

    expect(lgBase()).toHaveClassName(['flex', 'p-6']);
    expect(lgItem()).toHaveClassName(['px-2', 'text-lg']);
  });

  test('should handle extends with non-slot object replacement', () => {
    const baseComponent = tv({
      base: 'flex',
      variants: {
        theme: {
          dark: 'bg-gray-800',
          light: 'bg-white',
        },
      },
    });

    const extendedComponent = tv({
      extend: baseComponent,
      variants: {
        theme: {
          custom: 'bg-purple-500',
          dark: 'bg-gray-900',
          // Should replace the entire theme variant, not merge
          light: 'bg-gray-100',
        },
      },
    });

    const lightResult = extendedComponent({ theme: 'light' });

    expect(lightResult).toHaveClassName(['flex', 'bg-gray-100']);

    const customResult = extendedComponent({ theme: 'custom' });

    expect(customResult).toHaveClassName(['flex', 'bg-purple-500']);
  });

  test('should handle recursive extends resolution', () => {
    const baseComponent = tv({
      base: 'flex',
      variants: {
        size: {
          sm: 'text-sm',
        },
      },
    });

    const middleComponent = tv({
      base: 'items-center',
      extend: baseComponent,
      variants: {
        color: {
          red: 'text-red-500',
        },
        size: {
          md: 'text-base',
        },
      },
    });

    const finalComponent = tv({
      base: 'justify-center',
      extend: middleComponent,
      variants: {
        size: {
          lg: 'text-lg',
        },
        theme: {
          dark: 'bg-gray-800',
        },
      },
    });

    const result = finalComponent({ color: 'red', size: 'sm', theme: 'dark' });

    expect(result).toHaveClassName([
      'flex',
      'items-center',
      'justify-center',
      'text-sm',
      'text-red-500',
      'bg-gray-800',
    ]);
  });

  test('should handle extends with compound variants merging', () => {
    const baseComponent = tv({
      base: 'flex',
      compoundVariants: [
        {
          class: 'shadow-lg',
          color: 'red',
          size: 'sm',
        },
      ],
      variants: {
        color: {
          blue: 'text-blue-500',
          red: 'text-red-500',
        },
        size: {
          md: 'text-base',
          sm: 'text-sm',
        },
      },
    });

    const extendedComponent = tv({
      compoundVariants: [
        {
          class: 'ring-2',
          color: 'blue',
          size: 'md',
        },
      ],
      extend: baseComponent,
    });

    // Should have both base and extended compound variants
    const baseCompound = extendedComponent({ color: 'red', size: 'sm' });

    expect(baseCompound).toHaveClassName(['flex', 'text-red-500', 'text-sm', 'shadow-lg']);

    const extendedCompound = extendedComponent({ color: 'blue', size: 'md' });

    expect(extendedCompound).toHaveClassName(['flex', 'text-blue-500', 'text-base', 'ring-2']);
  });

  test('should handle extends with compound slots merging', () => {
    const baseComponent = tv({
      slots: {
        base: 'flex',
        item: 'px-2',
      },
      variants: {
        color: {
          blue: {
            base: 'text-blue-500',
            item: 'text-blue-600',
          },
          red: {
            base: 'text-red-500',
            item: 'text-red-600',
          },
        },
      },
    });

    const extendedComponent = tv({
      extend: baseComponent,
      variants: {
        color: {
          blue: {
            base: 'text-blue-700',
            item: 'text-blue-800',
          },
          // the red variant should remain from the base
        },
      },
    });

    // Should merge variant definitions
    const { base: blueBase, item: blueItem } = extendedComponent({ color: 'blue' });

    expect(blueBase()).toHaveClassName(['flex', 'text-blue-700']);
    expect(blueItem()).toHaveClassName(['px-2', 'text-blue-800']);

    const { base: redBase, item: redItem } = extendedComponent({ color: 'red' });

    expect(redBase()).toHaveClassName(['flex', 'text-red-500']);
    expect(redItem()).toHaveClassName(['px-2', 'text-red-600']);
  });

  test('should handle extends with defaultVariants override', () => {
    const baseComponent = tv({
      base: 'flex',
      defaultVariants: {
        color: 'red',
        size: 'sm',
      },
      variants: {
        color: {
          blue: 'text-blue-500',
          red: 'text-red-500',
        },
        size: {
          lg: 'text-lg',
          md: 'text-base',
          sm: 'text-sm',
        },
      },
    });

    const extendedComponent = tv({
      defaultVariants: {
        color: 'blue', // Override
        size: 'lg', // Override
        // Adds new default
      },
      extend: baseComponent,
      variants: {
        theme: {
          dark: 'bg-gray-800',
          light: 'bg-white',
        },
      },
    });

    // Should use extended default variants
    const result = extendedComponent();

    expect(result).toHaveClassName(['flex', 'text-blue-500', 'text-lg']);

    // Should allow overriding with props
    const overridden = extendedComponent({ color: 'red', size: 'sm' });

    expect(overridden).toHaveClassName(['flex', 'text-red-500', 'text-sm']);
  });

  test('should handle extends with empty configurations', () => {
    const baseComponent = tv({
      base: 'flex',
    });

    const extendedComponent = tv({
      extend: baseComponent,
      variants: {
        color: {
          red: 'text-red-500',
        },
      },
    });

    const result = extendedComponent({ color: 'red' });

    expect(result).toHaveClassName(['flex', 'text-red-500']);
  });

  test('should handle extends with undefined extend property', () => {
    const component = tv({
      base: 'flex',
      variants: {
        size: {
          sm: 'text-sm',
        },
      },
    });

    const result = component({ size: 'sm' });

    expect(result).toHaveClassName(['flex', 'text-sm']);
  });
});
