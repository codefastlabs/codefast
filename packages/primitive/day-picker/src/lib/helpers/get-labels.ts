import * as defaultLabels from '@/lib/labels';
import { type DayPickerProps, type Labels } from '@/lib/types';

/** Return the formatters from the props merged with the default formatters. */
export function getLabels(customLabels: DayPickerProps['labels']): Labels {
  return {
    ...defaultLabels,
    ...customLabels,
  };
}
