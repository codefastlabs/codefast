'use client';

import type { ComponentProps, JSX, ReactNode } from 'react';
import type { CustomComponents, DateRange, DayPickerProps } from 'react-day-picker';

import { format } from 'date-fns';
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, DotIcon } from 'lucide-react';
import { DayFlag, DayPicker, SelectionState, UI } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/variants/button.variants';

/* -----------------------------------------------------------------------------
 * Component: Chevron
 * -------------------------------------------------------------------------- */

type ChevronProps = ComponentProps<CustomComponents['Chevron']>;

function Chevron({ orientation, className, ...props }: ChevronProps): JSX.Element {
  switch (orientation) {
    case 'up': {
      return <ChevronUpIcon className={cn('size-4', className)} {...props} />;
    }

    case 'down': {
      return <ChevronDownIcon className={cn('size-4', className)} {...props} />;
    }

    case 'left': {
      return <ChevronLeftIcon className={cn('size-4', className)} {...props} />;
    }

    case 'right': {
      return <ChevronRightIcon className={cn('size-4', className)} {...props} />;
    }

    default: {
      return <DotIcon className={cn('size-4', className)} {...props} />;
    }
  }
}

/* -----------------------------------------------------------------------------
 * Component: Calendar
 * -------------------------------------------------------------------------- */

type CalendarProps = DayPickerProps;

function Calendar({ showOutsideDays = true, classNames, ...props }: CalendarProps): JSX.Element {
  const isInteractive = props.mode !== undefined || props.onDayClick !== undefined;

  return (
    <DayPicker
      classNames={{
        [UI.Root]: cn('UI.Root', '', classNames?.[UI.Root]),
        [UI.Chevron]: cn('UI.Chevron', '', classNames?.[UI.Chevron]),
        [UI.Day]: cn(
          'UI.Day',
          'grid place-items-center text-center text-sm',
          isInteractive ? 'min-w-8.5 group' : 'min-w-8.5 h-8',
          classNames?.[UI.Day],
        ),
        [UI.DayButton]: cn(
          'group-[.is-outside]:text-muted-foreground hover:not-disabled:not-group-aria-selected:bg-accent hover:not-disabled:not-group-aria-selected:text-accent-foreground group-data-today:not-group-aria-selected:bg-accent group-aria-selected:not-group-[.is-range-middle]:bg-primary group-aria-selected:not-group-[.is-range-middle]:text-primary-foreground size-8 rounded-lg transition disabled:opacity-50',
          classNames?.[UI.DayButton],
        ),
        [UI.CaptionLabel]: cn(
          'UI.CaptionLabel',
          'flex items-center gap-2 [&>svg]:opacity-50',
          classNames?.[UI.CaptionLabel],
        ),
        [UI.Dropdowns]: cn('UI.Dropdowns', 'flex gap-4', classNames?.[UI.Dropdowns]),
        [UI.Dropdown]: cn('UI.Dropdown', 'absolute opacity-0', classNames?.[UI.Dropdown]),
        [UI.DropdownRoot]: cn('UI.DropdownRoot', 'relative', classNames?.[UI.DropdownRoot]),
        [UI.Footer]: cn('UI.Footer', '', classNames?.[UI.Footer]),
        [UI.MonthGrid]: cn('UI.MonthGrid', '', classNames?.[UI.MonthGrid]),
        [UI.MonthCaption]: cn('UI.MonthCaption', 'py-1 text-sm font-medium', classNames?.[UI.MonthCaption]),
        [UI.MonthsDropdown]: cn('UI.MonthsDropdown', '', classNames?.[UI.MonthsDropdown]),
        [UI.Month]: cn('UI.Month', 'flex flex-col gap-4', classNames?.[UI.Month]),
        [UI.Months]: cn('UI.Months', 'relative inline-flex flex-wrap gap-4', classNames?.[UI.Months]),
        [UI.Nav]: cn('UI.Nav', 'absolute end-0 flex gap-2', classNames?.[UI.Nav]),
        [UI.NextMonthButton]: cn(
          'UI.NextMonthButton',
          buttonVariants({ variant: 'ghost', className: '', size: '2xs', icon: true }),
          classNames?.[UI.NextMonthButton],
        ),
        [UI.PreviousMonthButton]: cn(
          'UI.PreviousMonthButton',
          buttonVariants({ variant: 'ghost', className: '', size: '2xs', icon: true }),
          classNames?.[UI.PreviousMonthButton],
        ),
        [UI.Week]: cn('UI.Week', 'mt-2 flex justify-between', classNames?.[UI.Week]),
        [UI.Weeks]: cn('UI.Weeks', '', classNames?.[UI.Weeks]),
        [UI.Weekday]: cn('UI.Weekday', 'text-muted-foreground min-w-8.5 text-xs font-medium', classNames?.[UI.Weekday]),
        [UI.Weekdays]: cn('UI.Weekdays', 'flex w-full justify-between', classNames?.[UI.Weekdays]),
        [UI.WeekNumber]: cn(
          'UI.WeekNumber',
          'text-muted-foreground min-w-8.5 grid h-8 place-items-center text-xs font-normal [&+*]:rounded-l-lg',
          classNames?.[UI.WeekNumber],
        ),
        [UI.WeekNumberHeader]: cn('UI.WeekNumberHeader', 'min-w-8.5', classNames?.[UI.WeekNumberHeader]),
        [UI.YearsDropdown]: cn('UI.YearsDropdown', '', classNames?.[UI.YearsDropdown]),

        [SelectionState.range_end]: cn(
          'is-range-end bg-accent rounded-r-lg first:rounded-l-lg',
          classNames?.[SelectionState.range_end],
        ),
        [SelectionState.range_middle]: cn(
          'is-range-middle bg-accent first:rounded-l-lg last:rounded-r-lg',
          classNames?.[SelectionState.range_middle],
        ),
        [SelectionState.range_start]: cn(
          'is-range-start bg-accent rounded-l-lg last:rounded-r-lg',
          classNames?.[SelectionState.range_start],
        ),
        [SelectionState.selected]: cn('is-selected', classNames?.[SelectionState.selected]),

        [DayFlag.disabled]: cn('is-disabled', classNames?.[DayFlag.disabled]),
        [DayFlag.focused]: cn('is-focused', classNames?.[DayFlag.focused]),
        [DayFlag.hidden]: cn('is-hidden size-8', classNames?.[DayFlag.hidden]),
        [DayFlag.outside]: cn('is-outside', classNames?.[DayFlag.outside]),
        [DayFlag.today]: cn('is-today', classNames?.[DayFlag.today]),
      }}
      components={{
        Chevron,
      }}
      showOutsideDays={showOutsideDays}
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
