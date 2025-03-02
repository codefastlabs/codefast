'use client';

import type { Components, DateRange, DayButtonProps, DayPickerProps } from '@codefast-ui/day-picker';
import type { ComponentProps, JSX, ReactNode } from 'react';

import { DayFlag, DayPicker, SelectionState, UI } from '@codefast-ui/day-picker';
import { format } from 'date-fns';
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, DotIcon } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Chevron
 * -------------------------------------------------------------------------- */

/* -----------------------------------------------------------------------------
 * Component: Chevron
 * -------------------------------------------------------------------------- */

type ChevronProps = ComponentProps<Components['Chevron']>;

function Chevron({ orientation, ...props }: ChevronProps): JSX.Element {
  switch (orientation) {
    case 'up': {
      return <ChevronUpIcon className="size-4" {...props} />;
    }

    case 'down': {
      return <ChevronDownIcon className="size-4" {...props} />;
    }

    case 'left': {
      return <ChevronLeftIcon className="size-4" {...props} />;
    }

    case 'right': {
      return <ChevronRightIcon className="size-4" {...props} />;
    }

    default: {
      return <DotIcon className="size-4" {...props} />;
    }
  }
}

/* -----------------------------------------------------------------------------
 * Component: DayButton
 * -------------------------------------------------------------------------- */

function DayButton({ className, day: _, modifiers, ...props }: DayButtonProps): JSX.Element {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (modifiers.focused) {
      buttonRef.current?.focus();
    }
  }, [modifiers.focused]);

  return (
    <button
      ref={buttonRef}
      className={cn('', className)}
      data-focused={modifiers.focused}
      data-hidden={modifiers.hidden}
      data-outside={modifiers.outside}
      data-today={modifiers.today}
      disabled={modifiers.disabled}
      type="button"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: Calendar
 * -------------------------------------------------------------------------- */

type CalendarProps = DayPickerProps;

function Calendar({ className, classNames, ...props }: CalendarProps): JSX.Element {
  return (
    <DayPicker
      showOutsideDays
      className={cn('', className)}
      classNames={{
        [UI.CaptionLabel]: cn('', classNames?.[UI.CaptionLabel]),
        [UI.Chevron]: cn('', classNames?.[UI.Chevron]),
        [UI.Day]: cn('', classNames?.[UI.Day]),
        [UI.DayButton]: cn('', classNames?.[UI.DayButton]),
        [UI.Dropdown]: cn('', classNames?.[UI.Dropdown]),
        [UI.DropdownRoot]: cn('', classNames?.[UI.DropdownRoot]),
        [UI.Dropdowns]: cn('', classNames?.[UI.Dropdowns]),
        [UI.Footer]: cn('', classNames?.[UI.Footer]),
        [UI.Month]: cn('', classNames?.[UI.Month]),
        [UI.MonthCaption]: cn('', classNames?.[UI.MonthCaption]),
        [UI.MonthGrid]: cn('', classNames?.[UI.MonthGrid]),
        [UI.Months]: cn('', classNames?.[UI.Months]),
        [UI.MonthsDropdown]: cn('', classNames?.[UI.MonthsDropdown]),
        [UI.Nav]: cn('', classNames?.[UI.Nav]),
        [UI.NextMonthButton]: cn('', classNames?.[UI.NextMonthButton]),
        [UI.PreviousMonthButton]: cn('', classNames?.[UI.PreviousMonthButton]),
        [UI.Root]: cn('', classNames?.[UI.Root]),
        [UI.Week]: cn('', classNames?.[UI.Week]),
        [UI.Weekday]: cn('', classNames?.[UI.Weekday]),
        [UI.Weekdays]: cn('', classNames?.[UI.Weekdays]),
        [UI.WeekNumber]: cn('', classNames?.[UI.WeekNumber]),
        [UI.WeekNumberHeader]: cn('', classNames?.[UI.WeekNumberHeader]),
        [UI.Weeks]: cn('', classNames?.[UI.Weeks]),
        [UI.YearsDropdown]: cn('', classNames?.[UI.YearsDropdown]),

        [SelectionState.range_end]: cn('', classNames?.[SelectionState.range_end]),
        [SelectionState.range_middle]: cn('', classNames?.[SelectionState.range_middle]),
        [SelectionState.range_start]: cn('', classNames?.[SelectionState.range_start]),
        [SelectionState.selected]: cn('', classNames?.[SelectionState.selected]),

        [DayFlag.disabled]: cn('', classNames?.[DayFlag.disabled]),
        [DayFlag.focused]: cn('', classNames?.[DayFlag.focused]),
        [DayFlag.hidden]: cn('', classNames?.[DayFlag.hidden]),
        [DayFlag.outside]: cn('', classNames?.[DayFlag.outside]),
        [DayFlag.today]: cn('', classNames?.[DayFlag.today]),
      }}
      components={{ Chevron, DayButton }}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: CalendarRangeLabel
 * -------------------------------------------------------------------------- */

interface CalendarRangeLabelProps {
  date: DateRange | undefined;
  formatStr?: string;
  placeholder?: string;
}

function CalendarRangeLabel({
  date,
  formatStr = 'LLL dd, y',
  placeholder = 'Pick a date',
}: CalendarRangeLabelProps): ReactNode {
  if (!date?.from) {
    return <span className="truncate">{placeholder}</span>;
  }

  const formattedFromDate = format(date.from, formatStr);

  if (!date.to) {
    return <span className="truncate">{formattedFromDate}</span>;
  }

  const formattedToDate = format(date.to, formatStr);

  return (
    <span className="truncate">
      {formattedFromDate} - {formattedToDate}
    </span>
  );
}

/* -----------------------------------------------------------------------------
 * Component: CalendarLabel
 * -------------------------------------------------------------------------- */

interface CalendarLabelProps {
  date: Date | undefined;
  formatStr?: string;
  placeholder?: string;
}

function CalendarLabel({ date, formatStr = 'PPP', placeholder = 'Pick a date' }: CalendarLabelProps): ReactNode {
  if (!date) {
    return <span className="truncate">{placeholder}</span>;
  }

  return <span className="truncate">{format(date, formatStr)}</span>;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { DateRange, Matcher } from '@codefast-ui/day-picker';
export type { CalendarLabelProps, CalendarProps, CalendarRangeLabelProps };
export { Calendar, CalendarLabel, CalendarRangeLabel };
