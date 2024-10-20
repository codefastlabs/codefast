import { Card, CardContent, CardDescription, CardHeader, CardTitle, Label } from '@codefast/ui';
import { type JSX } from 'react';

import { DatePickerWithRange } from '@/components/date-picker-with-range';

export function Calendar(): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendar</CardTitle>
        <CardDescription>Keep track of important dates with the calendar.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label className="shrink-0" htmlFor="date">
            Pick a date
          </Label>
          <DatePickerWithRange className="[&>button]:w-64" />
        </div>
      </CardContent>
    </Card>
  );
}
