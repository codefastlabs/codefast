import { tv } from '@/index';

describe('Tailwind Variants (TV) - Default (ClassName)', () => {
  test('should work with compoundVariants using className', () => {
    const h1 = tv({
      base: 'text-3xl font-bold',
      compoundVariants: [
        {
          className: 'bg-red-500',
          color: 'red',
          isBig: true,
        },
        {
          className: 'underline',
          color: 'red',
          isBig: false,
        },
      ],
      variants: {
        color: {
          blue: 'text-blue-500',
          red: 'text-red-500',
        },
        isBig: {
          false: 'text-2xl',
          true: 'text-5xl',
        },
      },
    });

    expect(
      h1({
        color: 'red',
        isBig: true,
      }),
    ).toHaveClassName(['text-5xl', 'font-bold', 'text-red-500', 'bg-red-500']);

    expect(
      h1({
        color: 'red',
        isBig: false,
      }),
    ).toHaveClassName(['text-2xl', 'font-bold', 'text-red-500', 'underline']);

    expect(
      h1({
        color: 'red',
      }),
    ).toHaveClassName(['text-2xl', 'font-bold', 'text-red-500', 'underline']);
  });

  test('should work with custom class & className', () => {
    const h1 = tv({
      base: 'text-3xl font-bold',
    });

    const expectedResult = ['text-xl', 'font-bold'];

    const result1 = h1({
      className: 'text-xl',
    });

    const result2 = h1({
      className: 'text-xl',
    });

    expect(result1).toHaveClassName(expectedResult);
    expect(result2).toHaveClassName(expectedResult);
  });

  test('should work with defaultVariants -- compoundVariants using className', () => {
    const h1 = tv({
      base: 'text-3xl',
      compoundVariants: [
        {
          className: 'bg-red-500',
          color: 'red',
          size: 'md',
        },
      ],
      defaultVariants: {
        color: 'red',
        size: 'md',
      },
      variants: {
        color: {
          blue: 'text-blue-500',
          red: 'text-red-500',
        },
        size: {
          md: 'text-lg',
          sm: 'text-sm',
        },
      },
    });

    expect(h1()).toHaveClassName(['text-red-500', 'text-lg', 'bg-red-500']);
    expect(h1({ color: 'blue' })).toHaveClassName(['text-blue-500', 'text-lg']);
    expect(h1({ size: 'sm' })).toHaveClassName(['text-red-500', 'text-sm']);
  });
});
