import * as defaultLabels from '@/labels';
import type { DayPickerProps, Labels } from '@/types';

/** Return the formatters from the props merged with the default formatters. */
export function getLabels(customLabels: DayPickerProps['labels']): Labels {
  return {
    ...defaultLabels,
    ...customLabels,
  };
}
