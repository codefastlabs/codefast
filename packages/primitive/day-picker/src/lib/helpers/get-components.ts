import type { Components, DayPickerProps } from '@/lib/types';

import * as components from '@/components/ui';

/**
 * Merges the default components with the custom components provided.
 *
 * @param customComponents - An object containing custom DayPicker components to override the defaults.
 * @returns An object with the merged default and custom DayPicker components.
 */
export function getComponents(customComponents: DayPickerProps['components']): Components {
  return {
    ...components,
    ...customComponents,
  };
}
