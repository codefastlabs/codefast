'use client';

import type { ComponentProps, JSX, ReactNode } from 'react';
import type { CustomComponents, DateRange, DayButtonProps, DayPickerProps } from 'react-day-picker';

import { format } from 'date-fns';
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, DotIcon } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { DayFlag, DayPicker, SelectionState, UI } from 'react-day-picker';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Chevron
 * -------------------------------------------------------------------------- */

type ChevronProps = ComponentProps<CustomComponents['Chevron']>;

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
        [UI.Root]: cn('UI.Root', '', classNames?.[UI.Root]),
        [UI.Chevron]: cn('UI.Chevron', '', classNames?.[UI.Chevron]),
        [UI.Day]: cn('UI.Day', '', classNames?.[UI.Day]),
        [UI.DayButton]: cn('UI.DayButton', '', classNames?.[UI.DayButton]),
        [UI.CaptionLabel]: cn('UI.CaptionLabel', '', classNames?.[UI.CaptionLabel]),
        [UI.Dropdowns]: cn('UI.Dropdowns', '', classNames?.[UI.Dropdowns]),
        [UI.Dropdown]: cn('UI.Dropdown', '', classNames?.[UI.Dropdown]),
        [UI.DropdownRoot]: cn('UI.DropdownRoot', '', classNames?.[UI.DropdownRoot]),
        [UI.Footer]: cn('UI.Footer', '', classNames?.[UI.Footer]),
        [UI.MonthGrid]: cn('UI.MonthGrid', '', classNames?.[UI.MonthGrid]),
        [UI.MonthCaption]: cn('UI.MonthCaption', '', classNames?.[UI.MonthCaption]),
        [UI.MonthsDropdown]: cn('UI.MonthsDropdown', '', classNames?.[UI.MonthsDropdown]),
        [UI.Month]: cn('UI.Month', '', classNames?.[UI.Month]),
        [UI.Months]: cn('UI.Months', '', classNames?.[UI.Months]),
        [UI.Nav]: cn('UI.Nav', '', classNames?.[UI.Nav]),
        [UI.NextMonthButton]: cn('UI.NextMonthButton', '', classNames?.[UI.NextMonthButton]),
        [UI.PreviousMonthButton]: cn('UI.PreviousMonthButton', '', classNames?.[UI.PreviousMonthButton]),
        [UI.Week]: cn('UI.Week', '', classNames?.[UI.Week]),
        [UI.Weeks]: cn('UI.Weeks', '', classNames?.[UI.Weeks]),
        [UI.Weekday]: cn('UI.Weekday', '', classNames?.[UI.Weekday]),
        [UI.Weekdays]: cn('UI.Weekdays', '', classNames?.[UI.Weekdays]),
        [UI.WeekNumber]: cn('UI.WeekNumber', '', classNames?.[UI.WeekNumber]),
        [UI.WeekNumberHeader]: cn('UI.WeekNumberHeader', '', classNames?.[UI.WeekNumberHeader]),
        [UI.YearsDropdown]: cn('UI.YearsDropdown', '', classNames?.[UI.YearsDropdown]),

        [SelectionState.range_end]: cn('SelectionState.range_end', '', classNames?.[SelectionState.range_end]),
        [SelectionState.range_middle]: cn('SelectionState.range_middle', '', classNames?.[SelectionState.range_middle]),
        [SelectionState.range_start]: cn('SelectionState.range_start', '', classNames?.[SelectionState.range_start]),
        [SelectionState.selected]: cn('SelectionState.selected', '', classNames?.[SelectionState.selected]),

        [DayFlag.disabled]: cn('DayFlag.disabled', '', classNames?.[DayFlag.disabled]),
        [DayFlag.focused]: cn('DayFlag.focused', '', classNames?.[DayFlag.focused]),
        [DayFlag.hidden]: cn('DayFlag.hidden', '', classNames?.[DayFlag.hidden]),
        [DayFlag.outside]: cn('DayFlag.outside', '', classNames?.[DayFlag.outside]),
        [DayFlag.today]: cn('DayFlag.today', '', classNames?.[DayFlag.today]),
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

export type { DateRange, Matcher } from 'react-day-picker';
export type { CalendarLabelProps, CalendarProps, CalendarRangeLabelProps };
export { Calendar, CalendarLabel, CalendarRangeLabel };
