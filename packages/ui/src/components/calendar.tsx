'use client';

import {
  type Components,
  type DateRange,
  type DayButtonProps,
  type DayPickerProps,
  DayFlag,
  DayPicker,
  SelectionState,
  UI,
} from '@codefast-ui/day-picker';
import { format } from 'date-fns';
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, DotIcon } from 'lucide-react';
import { type ComponentProps, type JSX, useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/styles/button-variants';

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
      className={buttonVariants({
        className: [
          'focus-visible:ring-1 focus-visible:ring-offset-0',
          (!modifiers.selected || modifiers.range_middle) && [
            modifiers.today ? 'bg-accent' : 'hover:border-accent hover:bg-transparent',
            modifiers.outside && 'text-opacity-30',
          ],
          modifiers.range_middle && 'bg-transparent',
          className,
        ],
        icon: true,
        size: 'sm',
        variant: modifiers.selected && !modifiers.range_middle ? 'default' : 'ghost',
      })}
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
      className={cn('p-3', className)}
      classNames={{
        [DayFlag.disabled]: cn('', classNames?.[DayFlag.disabled]),
        [DayFlag.focused]: cn('', classNames?.[DayFlag.focused]),
        [DayFlag.hidden]: cn('invisible', classNames?.[DayFlag.hidden]),
        [DayFlag.outside]: cn(!props.mode && 'text-opacity-30', classNames?.[DayFlag.outside]),
        [DayFlag.today]: cn(!props.mode && 'bg-accent rounded-md', classNames?.[DayFlag.today]),
        [SelectionState.range_end]: cn(
          'to-accent rounded-r-md bg-gradient-to-l from-transparent to-50% first:rounded-l-md',
          classNames?.[SelectionState.range_end],
        ),
        [SelectionState.range_middle]: cn(
          'bg-accent first:rounded-l-md last:rounded-r-md',
          classNames?.[SelectionState.range_middle],
        ),
        [SelectionState.range_start]: cn(
          'to-accent rounded-l-md bg-gradient-to-r from-transparent to-50% last:rounded-r-md',
          classNames?.[SelectionState.range_start],
        ),
        [SelectionState.selected]: cn('', classNames?.[SelectionState.selected]),
        [UI.CaptionLabel]: cn('inline-flex items-center', classNames?.[UI.CaptionLabel]),
        [UI.Chevron]: cn('', classNames?.[UI.Chevron]),
        [UI.Day]: cn(
          'py-0',
          !props.mode && 'text-foreground mx-px flex min-h-9 min-w-9 items-center justify-center text-sm font-medium',
          classNames?.[UI.Day],
        ),
        [UI.DayButton]: cn('border border-transparent', classNames?.[UI.DayButton]),
        [UI.Dropdown]: cn('absolute size-full appearance-none opacity-0', classNames?.[UI.Dropdown]),
        [UI.DropdownRoot]: cn('relative inline-flex', classNames?.[UI.DropdownRoot]),
        [UI.Dropdowns]: cn('inline-flex items-center gap-2', classNames?.[UI.Dropdowns]),
        [UI.Footer]: cn('text-sm', classNames?.[UI.Footer]),
        [UI.Month]: cn(
          'grid grid-rows-[2rem_1fr] gap-4',
          !((props.numberOfMonths || 0) > 1) && 'w-full',
          classNames?.[UI.Month],
        ),
        [UI.MonthCaption]: cn('flex w-full justify-center text-sm font-medium', classNames?.[UI.MonthCaption]),
        [UI.MonthGrid]: cn(
          'relative block table-fixed border-collapse space-y-2 [&>thead]:block',
          classNames?.[UI.MonthGrid],
        ),
        [UI.Months]: cn('relative flex flex-wrap gap-4', classNames?.[UI.Months]),
        [UI.MonthsDropdown]: cn('', classNames?.[UI.MonthsDropdown]),
        [UI.Nav]: cn('-mr-4', classNames?.[UI.Nav]),
        [UI.NextMonthButton]: buttonVariants({
          className: ['absolute end-0', classNames?.[UI.NextMonthButton]],
          icon: true,
          size: 'xs',
          variant: 'outline',
        }),
        [UI.PreviousMonthButton]: buttonVariants({
          className: ['absolute start-0', classNames?.[UI.PreviousMonthButton]],
          icon: true,
          size: 'xs',
          variant: 'outline',
        }),
        [UI.Root]: cn('inline-grid gap-4', classNames?.[UI.Root]),
        [UI.Week]: cn('flex justify-between', classNames?.[UI.Week]),
        [UI.Weekday]: cn('text-muted-foreground flex-1 text-sm font-normal', classNames?.[UI.Weekday]),
        [UI.Weekdays]: cn('flex justify-between', classNames?.[UI.Weekdays]),
        [UI.WeekNumber]: cn('text-foreground/50 size-9 text-center text-xs', classNames?.[UI.WeekNumber]),
        [UI.WeekNumberHeader]: cn('', classNames?.[UI.WeekNumberHeader]),
        [UI.Weeks]: cn('grid gap-y-2', classNames?.[UI.Weeks]),
        [UI.YearsDropdown]: cn('', classNames?.[UI.YearsDropdown]),
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
}: CalendarRangeLabelProps): JSX.Element | string {
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

function CalendarLabel({
  date,
  formatStr = 'PPP',
  placeholder = 'Pick a date',
}: CalendarLabelProps): JSX.Element | string {
  if (!date) {
    return <span className="truncate">{placeholder}</span>;
  }

  return <span className="truncate">{format(date, formatStr)}</span>;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  Calendar,
  CalendarLabel,
  CalendarRangeLabel,
  type CalendarLabelProps,
  type CalendarProps,
  type CalendarRangeLabelProps,
};

export { type DateRange, type Matcher } from '@codefast-ui/day-picker';
