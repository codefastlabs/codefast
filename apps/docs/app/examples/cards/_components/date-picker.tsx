import { DatePickerWithRange } from '@/components/date-picker-with-range';
import { Card, CardBody, Label } from '@codefast/ui';
import { type JSX } from 'react';

export function DatePicker(): JSX.Element {
  return (
    <Card>
      <CardBody className="pt-6">
        <div className="space-y-2">
          <Label className="shrink-0" htmlFor="date">
            Pick a date
          </Label>
          <DatePickerWithRange className="[&>button]:w-64" />
        </div>
      </CardBody>
    </Card>
  );
}
