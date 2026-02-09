import { cn, createTV } from '@/index';

describe('cn function', () => {
  test('should work like cx but with tailwind-merge', () => {
    const result = cn('text-xl', 'text-blue-500', 'text-2xl', 'text-red-500');

    expect(result).toBe('text-2xl text-red-500');
  });

  test('should handle conditional classes', () => {
    const isActive = true;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const result = cn('base-class', isActive ? 'active-class' : '', 'text-xl', 'text-blue-500');

    expect(result).toBe('base-class active-class text-xl text-blue-500');
  });

  test('should handle arrays and objects', () => {
    const result = cn(['text-xl', 'font-bold'], { 'text-blue-500': false, 'text-red-500': true });

    expect(result).toBe('text-xl font-bold text-red-500');
  });

  test('should handle empty values', () => {
    const result = cn('', null, undefined, false, 0, 'text-xl');

    expect(result).toBe('text-xl');
  });

  test('should work with conflicting classes', () => {
    const result = cn('p-4', 'p-8', 'm-2', 'm-4');

    expect(result).toBe('p-8 m-4');
  });

  test('should work with non-conflicting classes', () => {
    const result = cn('text-xl', 'font-bold', 'text-blue-500', 'bg-white');

    expect(result).toBe('text-xl font-bold text-blue-500 bg-white');
  });
});

describe('cn function from createTV', () => {
  test('should use global twMerge config', () => {
    const { cn: cnWithMerge } = createTV({ twMerge: true });
    const result = cnWithMerge('text-xl', 'text-blue-500', 'text-2xl');

    expect(result).toBe('text-blue-500 text-2xl');
  });

  test('should respect twMerge: false', () => {
    const { cn: cnWithoutMerge } = createTV({ twMerge: false });
    const result = cnWithoutMerge('text-xl', 'text-blue-500', 'text-2xl');

    expect(result).toBe('text-xl text-blue-500 text-2xl');
  });

  test('should use custom twMergeConfig', () => {
    const { cn: cnWithConfig } = createTV({
      twMerge: true,
      twMergeConfig: {
        extend: {
          classGroups: {
            'font-size': ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl'],
          },
          conflictingClassGroups: {
            'font-size': ['font-size'],
          },
        },
      },
    });

    const result = cnWithConfig('text-lg', 'text-xl', 'text-2xl');

    expect(result).toBe('text-2xl');
  });

  test('should work with complex class combinations', () => {
    const { cn: cnWithMerge } = createTV({ twMerge: true });
    const result = cnWithMerge(
      'px-4 py-2',
      'px-8 py-4',
      'bg-blue-500',
      'bg-red-500',
      'text-white',
      'rounded-md',
      'rounded-lg',
    );

    expect(result).toBe('px-8 py-4 bg-red-500 text-white rounded-lg');
  });

  test('should handle mixed conditional and static classes', () => {
    const { cn: cnWithMerge } = createTV({ twMerge: true });
    const isLarge = true;
    const isBlue = false;

    const result = cnWithMerge(
      'base-class',
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      isLarge ? 'text-lg' : '',
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      isBlue ? 'text-blue-500' : '',
      'text-red-500',
      'text-xl',
    );

    expect(result).toBe('base-class text-red-500 text-xl');
  });
});
