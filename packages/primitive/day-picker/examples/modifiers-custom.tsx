import type { JSX, MouseEvent } from 'react';

import type { DayEventHandler } from '@/lib';

import { DayPicker } from '@/components';

export const bookedDays = [
  new Date(2024, 5, 8),
  new Date(2024, 5, 9),
  new Date(2024, 5, 10),
  {
    from: new Date(2024, 5, 15),
    to: new Date(2024, 5, 20),
  },
];

const style = `
.booked {
  position: relative;
}
/* Strikeout */
.booked::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 2px;
  background: currentColor;
  z-index: 1;
  transform: rotate(-45deg);
}`;

const handleDayClick: DayEventHandler<MouseEvent> = (day, { booked }) => {
  // eslint-disable-next-line no-alert -- This is a test message
  alert(`Day ${day.toLocaleDateString()} is booked? ${booked}`);
};

export function ModifiersCustom(): JSX.Element {
  return (
    <>
      <style>{style}</style>
      <DayPicker
        defaultMonth={new Date(2024, 5)}
        modifiers={{ booked: bookedDays }}
        modifiersClassNames={{ booked: 'booked' }}
        onDayClick={handleDayClick}
      />
    </>
  );
}
