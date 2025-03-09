'use client';

import type { ComponentProps, JSX, ReactNode } from 'react';
import type { CustomComponents, DateRange } from 'react-day-picker';

import { format } from 'date-fns';
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, DotIcon } from 'lucide-react';
import { DayFlag, DayPicker, SelectionState, UI } from 'react-day-picker';

import { buttonVariants } from '@/components/button';
import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Chevron
 * -------------------------------------------------------------------------- */

function Chevron({ orientation, className, ...props }: ComponentProps<CustomComponents['Chevron']>): JSX.Element {
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

function Calendar({ showOutsideDays = true, classNames, ...props }: ComponentProps<typeof DayPicker>): JSX.Element {
  const isInteractive = props.mode !== undefined || props.onDayClick !== undefined;

  return (
    <DayPicker
      classNames={{
        [UI.Root]: cn('p-3', classNames?.[UI.Root]),
        [UI.Chevron]: cn(classNames?.[UI.Chevron]),
        [UI.Day]: cn(
          'grid place-items-center text-center text-sm',
          isInteractive ? 'min-w-8.5 group' : 'min-w-8.5 h-8',
          classNames?.[UI.Day],
        ),
        [UI.DayButton]: cn(
          'group-[.is-outside]:text-muted-foreground hover:not-disabled:not-group-aria-selected:bg-secondary hover:not-disabled:not-group-aria-selected:text-secondary-foreground group-data-today:not-group-aria-selected:bg-secondary group-data-today:not-group-aria-selected:text-secondary-foreground group-aria-selected:not-group-[.is-range-middle]:bg-primary group-aria-selected:not-group-[.is-range-middle]:text-primary-foreground size-8 rounded-lg disabled:opacity-50',
          classNames?.[UI.DayButton],
        ),
        [UI.CaptionLabel]: cn('flex items-center gap-2 [&>svg]:opacity-50', classNames?.[UI.CaptionLabel]),
        [UI.Dropdowns]: cn('flex gap-4', classNames?.[UI.Dropdowns]),
        [UI.Dropdown]: cn('absolute opacity-0', classNames?.[UI.Dropdown]),
        [UI.DropdownRoot]: cn('relative', classNames?.[UI.DropdownRoot]),
        [UI.Footer]: cn(classNames?.[UI.Footer]),
        [UI.MonthGrid]: cn(classNames?.[UI.MonthGrid]),
        [UI.MonthCaption]: cn('py-1 text-sm font-medium', classNames?.[UI.MonthCaption]),
        [UI.MonthsDropdown]: cn(classNames?.[UI.MonthsDropdown]),
        [UI.Month]: cn('flex flex-col gap-4', classNames?.[UI.Month]),
        [UI.Months]: cn('relative inline-flex flex-wrap gap-4', classNames?.[UI.Months]),
        [UI.Nav]: cn('absolute end-0 flex gap-2', classNames?.[UI.Nav]),
        [UI.NextMonthButton]: cn(
          buttonVariants({ variant: 'ghost', size: '2xs', icon: true }),
          classNames?.[UI.NextMonthButton],
        ),
        [UI.PreviousMonthButton]: cn(
          buttonVariants({ variant: 'ghost', size: '2xs', icon: true }),
          classNames?.[UI.PreviousMonthButton],
        ),
        [UI.Week]: cn('mt-2 flex justify-between', classNames?.[UI.Week]),
        [UI.Weeks]: cn(classNames?.[UI.Weeks]),
        [UI.Weekday]: cn('text-muted-foreground min-w-8.5 text-xs font-medium', classNames?.[UI.Weekday]),
        [UI.Weekdays]: cn('flex w-full justify-between', classNames?.[UI.Weekdays]),
        [UI.WeekNumber]: cn(
          'text-muted-foreground min-w-8.5 grid h-8 place-items-center text-xs font-normal [&+*]:rounded-l-lg',
          classNames?.[UI.WeekNumber],
        ),
        [UI.WeekNumberHeader]: cn('min-w-8.5', classNames?.[UI.WeekNumberHeader]),
        [UI.YearsDropdown]: cn(classNames?.[UI.YearsDropdown]),

        [SelectionState.range_end]: cn(
          'to-secondary is-range-end rounded-r-lg bg-gradient-to-l first:rounded-l-lg',
          classNames?.[SelectionState.range_end],
        ),
        [SelectionState.range_middle]: cn(
          'is-range-middle bg-secondary text-secondary-foreground first:rounded-l-lg last:rounded-r-lg',
          classNames?.[SelectionState.range_middle],
        ),
        [SelectionState.range_start]: cn(
          'to-secondary is-range-start rounded-l-lg bg-gradient-to-r last:rounded-r-lg',
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

function CalendarRangeLabel({
  date,
  formatStr = 'LLL dd, y',
  placeholder = 'Pick a date',
}: {
  date: DateRange | undefined;
  formatStr?: string;
  placeholder?: string;
}): ReactNode {
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

function CalendarLabel({
  date,
  formatStr = 'PPP',
  placeholder = 'Pick a date',
}: {
  date: Date | undefined;
  formatStr?: string;
  placeholder?: string;
}): ReactNode {
  if (!date) {
    return <span className="truncate">{placeholder}</span>;
  }

  return <span className="truncate">{format(date, formatStr)}</span>;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { DateRange, Matcher } from 'react-day-picker';
export { Calendar, CalendarLabel, CalendarRangeLabel };
