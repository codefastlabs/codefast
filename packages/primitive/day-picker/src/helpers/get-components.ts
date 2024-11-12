import * as components from '@/components';
import type { CustomComponents, DayPickerProps } from '@/types';

export function getComponents(customComponents: DayPickerProps['components']): CustomComponents {
  return {
    ...components,
    ...customComponents,
  };
}
