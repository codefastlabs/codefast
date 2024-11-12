import React from 'react';

import { DayPicker } from '@/day-picker';
import { type DateRange } from '@/types/shared';

function Test() {
  return (
    <>
      <DayPicker />
      <DayPicker mode="single" />
      <DayPicker mode="single" selected={undefined} onSelect={(date: Date | undefined) => {}} />
      <DayPicker mode="single" selected={new Date()} onSelect={(date: Date | undefined) => {}} />
      {/* @ts-expect-error Missing `selected` */}
      <DayPicker required mode="single" onSelect={(date: Date | undefined) => {}} />
      {/* Allow undefined as initial selected value */}
      <DayPicker required mode="single" selected={undefined} />
      <DayPicker
        required
        mode="multiple"
        selected={undefined}
        onSelect={(selected: Date[], date: Date, modifiers) => {}}
      />
      <DayPicker
        required
        mode="range"
        selected={undefined}
        onSelect={(selected: DateRange, date: Date, modifiers) => {}}
      />
      <DayPicker
        mode="multiple"
        required={false}
        selected={undefined}
        // @ts-expect-error Selected can be also undefined
        onSelect={(selected: Date[], date: Date, modifiers) => {}}
      />
      {/** @ts-expect-error Wrong selected prop */}
      <DayPicker mode="multiple" selected={new Date()} />
      <DayPicker mode="multiple" onSelect={(date: Date[] | undefined) => {}} />
      <DayPicker required mode="multiple" selected={[]} onSelect={(date: Date[]) => {}} />
      <DayPicker mode="single" selected={new Date()} />
      <DayPicker modifiers={{ selected: new Date() }} onDayClick={() => {}} />
      <DayPicker selected={new Date()} onDayClick={() => {}} onSelect={() => {}} />
    </>
  );
}

it('should type-check', () => {
  expect(Test).toBeTruthy();
});
