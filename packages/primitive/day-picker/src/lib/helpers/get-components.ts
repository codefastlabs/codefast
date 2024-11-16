import * as components from '@/components/ui';
import { type Components, type DayPickerProps } from '@/lib/types';

export function getComponents(customComponents: DayPickerProps['components']): Components {
  return {
    ...components,
    ...customComponents,
  };
}
