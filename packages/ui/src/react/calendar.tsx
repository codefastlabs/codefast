'use client';

import * as React from 'react';
import { type CustomComponents, type DateRange, DayPicker, type DayPickerProps, UI } from 'react-day-picker';
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  DotFilledIcon,
} from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/react/button';

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
 * Component: DayButton
 * -------------------------------------------------------------------------- */

function DayButton({
  day: _,
  modifiers,
  className,
  ...props
}: React.ComponentProps<CustomComponents['DayButton']>): React.JSX.Element {
  return (
    <Button
      className={cn(
        modifiers.today && !modifiers.selected && 'bg-accent',
        modifiers.outside && !modifiers.selected && 'text-opacity-50',
        className,
      )}
      size="icon-sm"
      variant={modifiers.selected ? 'default' : 'ghost'}
      {...props}
      {...props}
    />
  );
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
        [UI.ButtonPrevious]: buttonVariants({ size: 'icon-xs', variant: 'ghost' }),
        [UI.ButtonNext]: buttonVariants({ size: 'icon-xs', variant: 'ghost' }),
        [UI.Root]: 'inline-grid gap-4',
        [UI.Chevron]: 'UI.Chevron',
        [UI.Day]: 'UI.Day',
        [UI.CaptionLabel]: 'inline-flex items-center',
        [UI.Dropdowns]: 'inline-flex items-center gap-2',
        [UI.Dropdown]: 'appearance-none opacity-0 absolute size-full',
        [UI.DropdownRoot]: 'relative inline-flex',
        [UI.Footer]: 'text-sm',
        [UI.MonthGrid]: 'UI.MonthGrid',
        [UI.MonthCaption]: 'flex text-sm font-medium',
        [UI.MonthsDropdown]: 'UI.MonthsDropdown',
        [UI.Month]: 'grid gap-1 grid-rows-[2rem_1fr]',
        [UI.Months]: 'relative grid grid-flow-col gap-4',
        [UI.Nav]: 'absolute end-0 grid grid-flow-col',
        [UI.Week]: 'UI.Week',
        [UI.Weeks]: 'UI.Weeks',
        [UI.Weekday]: 'text-muted-foreground text-sm font-normal size-9',
        [UI.Weekdays]: 'UI.Weekdays',
        [UI.WeekNumber]: 'text-foreground/50 text-sm size-9 text-center',
        [UI.WeekNumberHeader]: 'UI.WeekNumberHeader',
        [UI.YearsDropdown]: 'UI.YearsDropdown',
        ...classNames,
      }}
      components={{ Chevron, DayButton }}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Calendar, type CalendarProps, type DateRange };
