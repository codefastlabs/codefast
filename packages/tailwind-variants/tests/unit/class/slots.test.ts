import { tv } from '@/index';
import { twMergeConfig } from '~/fixtures/tailwind-merge-config';

describe('Tailwind Variants (TV) - Slots', () => {
  test('should work with slots -- default variants', () => {
    const menu = tv({
      base: 'text-3xl font-bold underline',
      defaultVariants: {
        color: 'primary',
        isDisabled: false,
        size: 'sm',
      },
      slots: {
        item: 'text-xl',
        list: 'list-none',
        title: 'text-2xl',
        wrapper: 'flex flex-col',
      },
      variants: {
        color: {
          primary: 'color--primary',
          secondary: {
            item: 'color--primary-item',
            list: 'color--primary-list',
            title: 'color--primary-title',
            wrapper: 'color--primary-wrapper',
          },
        },
        isDisabled: {
          false: {
            item: 'enabled--item',
          },
          true: {
            title: 'disabled--title',
          },
        },
        size: {
          md: {
            title: 'size--md-title',
          },
          sm: 'size--sm',
          xs: 'size--xs',
        },
      },
    });

    const { base, item, list, title, wrapper } = menu();

    expect(base()).toHaveClassName(['text-3xl', 'font-bold', 'underline', 'color--primary', 'size--sm']);
    expect(title()).toHaveClassName(['text-2xl']);
    expect(item()).toHaveClassName(['text-xl', 'enabled--item']);
    expect(list()).toHaveClassName(['list-none']);
    expect(wrapper()).toHaveClassName(['flex', 'flex-col']);
  });

  test('should work with empty slots', () => {
    const menu = tv({
      slots: {
        base: '',
        item: '',
        list: '',
        title: '',
      },
    });

    const { base, item, list, title } = menu();

    const expectedResult = undefined;

    expect(base()).toBe(expectedResult);
    expect(title()).toBe(expectedResult);
    expect(item()).toBe(expectedResult);
    expect(list()).toBe(expectedResult);
  });

  test('should work with slots -- default variants -- custom class & class', () => {
    const menu = tv({
      defaultVariants: {
        color: 'primary',
        isDisabled: false,
        size: 'sm',
      },
      slots: {
        base: 'text-3xl font-bold underline',
        item: 'text-xl',
        list: 'list-none',
        title: 'text-2xl',
        wrapper: 'flex flex-col',
      },
      variants: {
        color: {
          primary: {
            base: 'bg-blue-500',
          },
          secondary: {
            item: 'bg-purple-100',
            list: 'bg-purple-200',
            title: 'text-white',
            wrapper: 'bg-transparent',
          },
        },
        isDisabled: {
          false: {
            item: 'opacity-100',
          },
          true: {
            title: 'opacity-50',
          },
        },
        size: {
          md: {
            title: 'text-md',
          },
          sm: {
            base: 'text-sm',
          },
          xs: {
            base: 'text-xs',
          },
        },
      },
    });

    const { base, item, list, title, wrapper } = menu();

    expect(base({ class: 'text-lg' })).toHaveClassName(['font-bold', 'underline', 'bg-blue-500', 'text-lg']);
    expect(base({ class: 'text-lg' })).toHaveClassName(['font-bold', 'underline', 'bg-blue-500', 'text-lg']);
    expect(title({ class: 'text-2xl' })).toHaveClassName(['text-2xl']);
    expect(title({ class: 'text-2xl' })).toHaveClassName(['text-2xl']);
    expect(item({ class: 'text-sm' })).toHaveClassName(['text-sm', 'opacity-100']);
    expect(list({ class: 'bg-blue-50' })).toHaveClassName(['list-none', 'bg-blue-50']);
    expect(wrapper({ class: 'flex-row' })).toHaveClassName(['flex', 'flex-row']);
    expect(wrapper({ class: 'flex-row' })).toHaveClassName(['flex', 'flex-row']);
  });

  test('should work with slots -- variant with boolean values', () => {
    const menu = tv({
      defaultVariants: {
        size: 'sm',
      },
      slots: {
        base: 'text-3xl font-bold underline',
        item: 'text-xl',
        list: 'list-none',
        title: 'text-2xl',
        wrapper: 'flex flex-col',
      },
      variants: {
        isHoverable: {
          false: {
            base: 'opacity-50',
          },
          true: {
            base: 'opacity-100',
          },
        },
        size: {
          lg: {
            base: 'text-lg',
            item: 'text-lg',
            list: 'text-lg',
            title: 'text-lg',
            wrapper: 'text-lg',
          },
          md: {
            base: 'text-md',
            item: 'text-md',
            list: 'text-md',
            title: 'text-md',
            wrapper: 'text-md',
          },
          sm: {
            base: 'text-sm',
            item: 'text-sm',
            list: 'text-sm',
            title: 'text-sm',
            wrapper: 'text-sm',
          },
        },
      },
    });

    const { base, item, list, title, wrapper } = menu({
      isHoverable: true,
      size: 'lg',
    });

    expect(base()).toHaveClassName(['font-bold', 'underline', 'opacity-100', 'text-lg']);
    expect(title()).toHaveClassName(['text-lg']);
    expect(item()).toHaveClassName(['text-lg']);
    expect(list()).toHaveClassName(['list-none', 'text-lg']);
    expect(wrapper()).toHaveClassName(['flex', 'flex-col', 'text-lg']);
  });

  test('should work with slots -- twMergeConfig', () => {
    const menu = tv(
      {
        defaultVariants: {
          color: 'primary',
        },
        slots: {
          base: 'text-3xl font-bold underline',
        },
        variants: {
          color: {
            primary: {
              base: [
                'text-tiny',
                'text-small',
                'text-medium',
                'text-large',
                'shadow-small',
                'shadow-medium',
                'shadow-large',
              ],
            },
          },
        },
      },
      {
        twMergeConfig,
      },
    );

    const { base } = menu();

    expect(base()).toHaveClassName(['font-bold', 'underline', 'text-large', 'shadow-large']);
  });

  test('should support slot level variant overrides', () => {
    const menu = tv({
      base: 'text-3xl',
      defaultVariants: {
        color: 'primary',
      },
      slots: {
        title: 'text-2xl',
      },
      variants: {
        color: {
          primary: {
            base: 'color--primary-base',
            title: 'color--primary-title',
          },
          secondary: {
            base: 'color--secondary-base',
            title: 'color--secondary-title',
          },
        },
      },
    });

    const { base, title } = menu();

    expect(base()).toHaveClassName(['text-3xl', 'color--primary-base']);
    expect(title()).toHaveClassName(['text-2xl', 'color--primary-title']);
    expect(base({ color: 'secondary' })).toHaveClassName(['text-3xl', 'color--secondary-base']);
    expect(title({ color: 'secondary' })).toHaveClassName(['text-2xl', 'color--secondary-title']);
  });

  test('should support slot level variant overrides - compoundVariants', () => {
    const menu = tv({
      base: 'text-3xl',
      compoundVariants: [
        {
          class: {
            title: 'truncate',
          },
          color: 'secondary',
        },
      ],
      defaultVariants: {
        color: 'primary',
      },
      slots: {
        title: 'text-2xl',
      },
      variants: {
        color: {
          primary: {
            base: 'color--primary-base',
            title: 'color--primary-title',
          },
          secondary: {
            base: 'color--secondary-base',
            title: 'color--secondary-title',
          },
        },
      },
    });

    const { base, title } = menu();

    expect(base()).toHaveClassName(['text-3xl', 'color--primary-base']);
    expect(title()).toHaveClassName(['text-2xl', 'color--primary-title']);
    expect(base({ color: 'secondary' })).toHaveClassName(['text-3xl', 'color--secondary-base']);
    expect(title({ color: 'secondary' })).toHaveClassName(['text-2xl', 'color--secondary-title', 'truncate']);
  });
});
