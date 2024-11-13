import { type JSX, useState } from 'react';

import { DayPicker } from '@/components';

export function CustomDayButton(): JSX.Element {
  const [selected, setSelected] = useState<Date>();

  return (
    <DayPicker
      components={{
        // eslint-disable-next-line react/no-unstable-nested-components -- kep for test
        DayButton: (props) => {
          const { day, modifiers: _modifiers, ...buttonProps } = props;

          return (
            <button
              {...buttonProps}
              type="button"
              onClick={() => {
                setSelected(undefined);
              }}
              onDoubleClick={() => {
                setSelected(day.date);
              }}
            />
          );
        },
      }}
      footer={selected?.toDateString() || 'Double click to select a date'}
      mode="single"
      selected={selected}
      onSelect={setSelected}
    />
  );
}
