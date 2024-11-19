import { type ClassNames, type DayPickerProps, getDefaultClassNames } from '@/lib';

/**
 * Merges the provided class names with default class names for a DayPicker component.
 *
 * @param classNames - An object containing custom class names to be merged with the default class names.
 * @returns An object containing the merged class names.
 */
export function getClassNames(classNames: DayPickerProps['classNames']): ClassNames {
  return {
    ...getDefaultClassNames(),
    ...classNames,
  };
}
