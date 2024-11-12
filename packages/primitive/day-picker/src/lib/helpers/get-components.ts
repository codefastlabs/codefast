import * as components from '@/components/ui';
import { type CustomComponents, type DayPickerProps } from '@/lib/types';

export function getComponents(customComponents: DayPickerProps['components']): CustomComponents {
  return {
    ...components,
    ...customComponents,
  };
}
