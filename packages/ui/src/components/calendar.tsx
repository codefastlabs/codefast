'use client';

import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  DotFilledIcon,
} from '@radix-ui/react-icons';
import { format } from 'date-fns';
import { type ComponentProps, type JSX, useEffect, useRef } from 'react';
import {
  type CalendarDay,
  type CustomComponents,
  type DateRange,
  DayFlag,
  DayPicker,
  type DayPickerProps,
  type Matcher,
  type Modifiers,
  SelectionState,
  UI,
} from 'react-day-picker';

import { Button } from '@/components/button';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/styles/button-variants';

/* -----------------------------------------------------------------------------
 * Component: Chevron
 * -------------------------------------------------------------------------- */

function Chevron({ orientation, ...props }: ComponentProps<CustomComponents['Chevron']>): JSX.Element {
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

    default:
      return <DotFilledIcon className="size-4" {...props} />;
  }
}

/* -----------------------------------------------------------------------------
 * Component: DayButton
 * -------------------------------------------------------------------------- */

interface DayButtonProps extends ComponentProps<'button'> {
  day: CalendarDay;
  modifiers: Modifiers;
}

function DayButton({ modifiers, className, day: _, ...props }: DayButtonProps): JSX.Element {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (modifiers.focused) {
      buttonRef.current?.focus();
    }
  }, [modifiers.focused]);

  return (
    <Button
      ref={buttonRef}
      icon
      className={cn(
        (!modifiers.selected || modifiers.range_middle) && [
          modifiers.today ? 'bg-accent' : 'hover:border-accent hover:bg-transparent',
          modifiers.outside && 'text-opacity-30',
        ],
        modifiers.range_middle && 'bg-transparent',
        className,
      )}
      size="sm"
      variant={modifiers.selected && !modifiers.range_middle ? 'default' : 'ghost'}
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
      className={cn('p-3', className)}
      classNames={{
        [DayFlag.outside]: cn(!props.mode && 'text-opacity-30'),
        [DayFlag.today]: cn(!props.mode && 'bg-accent rounded-md'),
        [SelectionState.range_end]: 'to-accent rounded-r-md bg-gradient-to-l from-transparent to-50%',
        [SelectionState.range_middle]: 'bg-accent first:rounded-l-md last:rounded-r-md',
        [SelectionState.range_start]: 'to-accent rounded-l-md bg-gradient-to-r from-transparent to-50%',
        [UI.CaptionLabel]: 'inline-flex items-center',
        [UI.Day]: cn(
          'px-px py-0',
          !props.mode && 'text-foreground mx-px flex min-h-9 min-w-9 items-center justify-center text-sm font-medium',
        ),
        [UI.DayButton]: 'border border-transparent',
        [UI.Dropdown]: 'absolute size-full appearance-none opacity-0',
        [UI.DropdownRoot]: 'relative inline-flex',
        [UI.Dropdowns]: 'inline-flex items-center gap-2',
        [UI.Footer]: 'text-sm',
        [UI.Month]: 'grid grid-rows-[2rem_1fr] gap-4',
        [UI.MonthCaption]: 'flex w-full justify-center text-sm font-medium',
        [UI.MonthGrid]: 'relative block table-fixed border-collapse space-y-2 [&>thead]:block',
        [UI.Months]: 'relative flex flex-wrap gap-4',
        [UI.Nav]: '-mr-4',
        [UI.NextMonthButton]: buttonVariants({
          className: 'absolute end-0',
          icon: true,
          size: 'xs',
          variant: 'outline',
        }),
        [UI.PreviousMonthButton]: buttonVariants({
          className: 'absolute start-0',
          icon: true,
          size: 'xs',
          variant: 'outline',
        }),
        [UI.Root]: 'inline-grid gap-4',
        [UI.Week]: 'flex',
        [UI.WeekNumber]: 'text-foreground/50 size-9 text-center text-xs',
        [UI.Weekday]: 'text-muted-foreground flex-1 text-sm font-normal',
        [UI.Weekdays]: 'flex',
        [UI.Weeks]: 'block space-y-2',
        ...classNames,
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
}: CalendarRangeLabelProps): string | JSX.Element {
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
}: CalendarLabelProps): string | JSX.Element {
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
  type DateRange,
  type Matcher,
};
