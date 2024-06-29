import { Card, CardContent } from '@codefast/ui/card';
import { Label } from '@codefast/ui/label';
import { type JSX } from 'react';
import { DatePickerWithRange } from '@/components/date-picker-with-range';

export function DemoDatePicker(): JSX.Element {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-2">
          <Label htmlFor="date" className="shrink-0">
            Pick a date
          </Label>
          <DatePickerWithRange className="[&>button]:w-64" />
        </div>
      </CardContent>
    </Card>
  );
}
