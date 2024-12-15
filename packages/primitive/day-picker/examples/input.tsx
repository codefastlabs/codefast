import type { JSX } from 'react';

import { format, isValid, parse } from 'date-fns';
import { useId, useState } from 'react';

import type { OnSelectHandler } from '@/lib';

import { DayPicker } from '@/components';

export function Input(): JSX.Element {
  const inputId = useId();

  // Hold the month in state to control the calendar when the input changes
  const [month, setMonth] = useState(new Date());

  // Hold the selected date in state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  // Hold the input value in state
  const [inputValue, setInputValue] = useState('');

  const handleDayPickerSelect: OnSelectHandler<Date | undefined> = (date) => {
    if (date) {
      setSelectedDate(date);
      setMonth(date);
      setInputValue(format(date, 'MM/dd/yyyy'));
    } else {
      setInputValue('');
      setSelectedDate(undefined);
    }
  };

  /**
   * A function to handle changes in an input field. It updates the input value and tries to parse it as a date in
   * MM/dd/yyyy format. If the input value represents a valid date, it sets the selected date and updates the month.
   * Otherwise, it clears the selected date.
   *
   * @param e - The change event triggered by the input element.
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setInputValue(e.target.value); // keep the input value in sync

    const parsedDate = parse(e.target.value, 'MM/dd/yyyy', new Date());

    if (isValid(parsedDate)) {
      setSelectedDate(parsedDate);
      setMonth(parsedDate);
    } else {
      setSelectedDate(undefined);
    }
  };

  return (
    <div>
      <label htmlFor={inputId}>
        <strong>Date:</strong>
      </label>

      <input
        id={inputId}
        placeholder="MM/dd/yyyy"
        style={{ fontSize: 'inherit', padding: '0.25em 0.5em' }}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
      />

      <div style={{ marginBlock: '1em' }}>
        <DayPicker
          footer={`Selected: ${selectedDate?.toDateString()}`}
          mode="single"
          month={month}
          selected={selectedDate}
          onMonthChange={setMonth}
          onSelect={handleDayPickerSelect}
        />
      </div>
    </div>
  );
}
