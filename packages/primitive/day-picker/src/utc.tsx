import { type JSX } from 'react';

import { DayPicker as DayPickerComponent, type DayPickerProps } from '@/index';

export function DayPicker(props: DayPickerProps): JSX.Element {
  return <DayPickerComponent timeZone="utc" {...props} />;
}
