'use client';

import * as React from 'react';
import { type CustomComponents, type DateRange, DayPicker, type DayPickerProps } from 'react-day-picker';
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  DotFilledIcon,
} from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Calendar
 * -------------------------------------------------------------------------- */

function Chevron({ orientation, ...props }: React.ComponentProps<CustomComponents['Chevron']>): React.JSX.Element {
  switch (orientation) {
    case 'up':
      return <ChevronUpIcon className="size-4" {...props} />;

    case 'down':
      return <ChevronDownIcon className="size-4" {...props} />;

    case 'left':
      return <ChevronLeftIcon className="size-4" {...props} />;

    case 'right':
      return <ChevronRightIcon className="size-4" {...props} />;

    default:
      return <DotFilledIcon className="size-4" {...props} />;
  }
}

type CalendarProps = DayPickerProps;

function Calendar({ className, showOutsideDays = true, ...props }: CalendarProps): React.JSX.Element {
  return (
    <DayPicker className={cn('p-3', className)} components={{ Chevron }} showOutsideDays={showOutsideDays} {...props} />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Calendar, type CalendarProps, type DateRange };
