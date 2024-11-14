import { type JSX } from 'react';

import { DayPicker } from '@/components/day-picker';

function Test(): JSX.Element {
  return (
    <>
      <DayPicker />

      <DayPicker mode="single" />

      <DayPicker
        mode="single"
        selected={undefined}
        onSelect={(_date) => {
          /* noop */
        }}
      />

      <DayPicker
        mode="single"
        selected={new Date()}
        onSelect={(_date) => {
          /* noop */
        }}
      />

      <DayPicker required mode="single" selected={undefined} />

      <DayPicker
        required
        mode="multiple"
        selected={undefined}
        onSelect={(_selected, _date, _modifiers) => {
          /* noop */
        }}
      />

      <DayPicker
        required
        mode="range"
        selected={undefined}
        onSelect={(_selected, _date, _modifiers) => {
          /* noop */
        }}
      />

      <DayPicker
        mode="multiple"
        required={false}
        selected={undefined}
        onSelect={(_selected, _date, _modifiers) => {
          /* noop */
        }}
      />

      <DayPicker mode="multiple" selected={[new Date()]} />

      <DayPicker
        mode="multiple"
        onSelect={(_date) => {
          /* noop */
        }}
      />

      <DayPicker
        required
        mode="multiple"
        selected={[]}
        onSelect={(_date) => {
          /* noop */
        }}
      />

      <DayPicker mode="single" selected={new Date()} />

      <DayPicker
        modifiers={{ selected: new Date() }}
        onDayClick={() => {
          /* noop */
        }}
      />

      <DayPicker
        selected={new Date()}
        onDayClick={() => {
          /* noop */
        }}
        onSelect={() => {
          /* noop */
        }}
      />
    </>
  );
}

test('should type-check', () => {
  expect(Test).toBeTruthy();
});
