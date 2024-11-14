import { type JSX } from 'react';

import { DayPicker } from '@/components';

export function MultipleMonthsPaged(): JSX.Element {
  return <DayPicker pagedNavigation numberOfMonths={2} />;
}
