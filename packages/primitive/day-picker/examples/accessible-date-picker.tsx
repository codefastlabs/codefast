import { format } from 'date-fns';
import { type JSX, useState } from 'react';

import { DayPicker } from '@/components';

export function AccessibleDatePicker(): JSX.Element {
  const [meetingDate, setMeetingDate] = useState<Date | undefined>(undefined);

  return (
    <DayPicker
      footer={
        meetingDate ? `Meeting date is set to ${format(meetingDate, 'PPPP')}` : 'Please pick a date for the meeting.'
      }
      labels={{
        labelDayButton: (date, modifiers) => {
          return modifiers.selected ? `Selected Meeting Date: ${format(date, 'PPP')}` : format(date, 'PPP');
        },
      }}
      mode="single"
      selected={meetingDate}
      onSelect={setMeetingDate}
    />
  );
}
