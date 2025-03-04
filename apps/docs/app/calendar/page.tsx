import type { Metadata } from 'next';
import type { JSX } from 'react';

import { UiKitCalendar } from '@/app/calendar/_component/ui-kit-calendar';

export const metadata: Metadata = {
  title: 'Calendar',
};

export default function CalendarPage(): JSX.Element {
  return (
    <main className="">
      <UiKitCalendar />
    </main>
  );
}
