'use client';

import * as React from 'react';
import {
  type CustomComponents,
  type DateRange,
  DayFlag,
  DayPicker,
  type DayPickerProps,
  SelectionState,
  UI,
} from 'react-day-picker';
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  DotFilledIcon,
} from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Chevron
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

/* -----------------------------------------------------------------------------
 * Component: Calendar
 * -------------------------------------------------------------------------- */

type CalendarProps = DayPickerProps;

function Calendar({ className, classNames, ...props }: CalendarProps): React.JSX.Element {
  return (
    <DayPicker
      className={cn('p-3', className)}
      classNames={{
        [UI.ButtonPrevious]: 'v-ButtonPrevious',
        [UI.ButtonNext]: 'v-ButtonNext',
        [UI.Root]: 'v-Root inline-flex',
        [UI.Chevron]: 'v-Chevron',
        [UI.Day]: 'v-Day',
        [UI.DayButton]: 'v-DayButton',
        [UI.CaptionLabel]: 'v-CaptionLabel',
        [UI.Dropdowns]: 'v-Dropdowns',
        [UI.Dropdown]: 'v-Dropdown',
        [UI.DropdownRoot]: 'v-DropdownRoot',
        [UI.Footer]: 'v-Footer',
        [UI.MonthGrid]: 'v-MonthGrid',
        [UI.MonthCaption]: 'v-MonthCaption',
        [UI.MonthsDropdown]: 'v-MonthsDropdown',
        [UI.Month]: 'v-Month',
        [UI.Months]: 'v-Months',
        [UI.Nav]: 'v-Nav',
        [UI.Week]: 'v-Week',
        [UI.Weeks]: 'v-Weeks',
        [UI.Weekday]: 'v-Weekday',
        [UI.Weekdays]: 'v-Weekdays',
        [UI.WeekNumber]: 'v-WeekNumber',
        [UI.WeekNumberHeader]: 'v-WeekNumberHeader',
        [UI.YearsDropdown]: 'v-YearsDropdown',
        [SelectionState.range_end]: 'v-range_end',
        [SelectionState.range_middle]: 'v-range_middle',
        [SelectionState.range_start]: 'v-range_start',
        [SelectionState.selected]: 'v-selected',
        [DayFlag.disabled]: 'v-disabled',
        [DayFlag.hidden]: 'v-hidden',
        [DayFlag.outside]: 'v-outside',
        [DayFlag.focused]: 'v-focused',
        [DayFlag.today]: 'v-today',
        ...classNames,
      }}
      components={{ Chevron }}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Calendar, type CalendarProps, type DateRange };
