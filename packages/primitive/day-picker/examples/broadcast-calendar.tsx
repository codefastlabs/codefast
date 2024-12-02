import { type JSX } from 'react';

import { DayPicker } from '@/components';

export function BroadcastCalendar(): JSX.Element {
  return <DayPicker broadcastCalendar showWeekNumber />;
}
