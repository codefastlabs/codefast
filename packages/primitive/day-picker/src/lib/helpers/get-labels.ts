import type { DayPickerProps, Labels } from '@/lib/types';

import * as defaultLabels from '@/lib/labels';

/**
 * Return the formatters from the props merged with the default formatters.
 */
export function getLabels(customLabels: DayPickerProps['labels']): Labels {
  if (!customLabels) {
    return defaultLabels;
  }

  return {
    ...defaultLabels,
    ...customLabels,
  };
}
