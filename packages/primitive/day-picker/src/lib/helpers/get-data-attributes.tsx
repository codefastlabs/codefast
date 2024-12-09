import { type DayPickerProps } from '@/lib/types';

/**
 * Return the `data-` attributes from the props.
 */
export function getDataAttributes(props: DayPickerProps): Record<string, unknown> {
  const dataAttributes: Record<string, unknown> = {
    'data-broadcast-calendar': props.broadcastCalendar || undefined,
    'data-mode': props.mode ?? undefined,
    'data-multiple-months': (props.numberOfMonths && props.numberOfMonths > 1) || undefined,
    'data-required': 'required' in props ? props.required : undefined,
    'data-week-numbers': props.showWeekNumber || undefined,
  };

  for (const [key, val] of Object.entries(props)) {
    if (key.startsWith('data-')) {
      dataAttributes[key] = val;
    }
  }

  return dataAttributes;
}
