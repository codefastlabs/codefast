import * as components from '@/components';
import { type CustomComponents, type DayPickerProps } from '@/lib/types';

export function getComponents(customComponents: DayPickerProps['components']): CustomComponents {
  return {
    ...components,
    ...customComponents,
  };
}
