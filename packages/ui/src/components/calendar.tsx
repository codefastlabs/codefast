'use client';

import * as React from 'react';
import {
  type CustomComponents,
  type DateRange,
  DayPicker,
  type DayPickerProps,
  type Matcher,
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
import { Button } from '@/components/button';
import { buttonVariants } from '@/styles/button-variants'; /* -----------------------------------------------------------------------------
 * Component: Chevron
 * -------------------------------------------------------------------------- */

/* -----------------------------------------------------------------------------
 * Component: Chevron
 * -------------------------------------------------------------------------- */

function Chevron({ orientation, ...props }: React.ComponentProps<CustomComponents['Chevron']>): React.JSX.Element {
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

function DayButton({
  day: _,
  modifiers,
  className,
  ...props
}: React.ComponentProps<CustomComponents['DayButton']>): React.JSX.Element {
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (modifiers.focused) {
      buttonRef.current?.focus();
    }
  }, [modifiers.focused]);

  return (
    <Button
      ref={buttonRef}
      className={cn(
        'focus-visible:-outline-offset-2',
        (!modifiers.selected || modifiers.range_middle) && !modifiers.today && 'hover:bg-transparent',
        modifiers.today && !modifiers.selected && 'bg-accent',
        modifiers.outside && (!modifiers.selected || modifiers.range_middle) && 'text-opacity-30',
        className,
      )}
      shape="square"
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

function Calendar({ className, classNames, ...props }: CalendarProps): React.JSX.Element {
  return (
    <DayPicker
      className={cn('p-3', className)}
      classNames={{
        [UI.PreviousMonthButton]: buttonVariants({
          size: 'xs',
          shape: 'square',
          variant: 'outline',
          className: 'absolute start-0 shadow-none',
        }),
        [UI.NextMonthButton]: buttonVariants({
          size: 'xs',
          shape: 'square',
          variant: 'outline',
          className: 'absolute end-0 shadow-none',
        }),
        [UI.Root]: 'inline-grid gap-4',
        [UI.Chevron]: '',
        [UI.Day]: 'py-0',
        [UI.DayButton]: 'hover:border-primary border border-transparent',
        [UI.CaptionLabel]: 'inline-flex items-center',
        [UI.Dropdowns]: 'inline-flex items-center gap-2',
        [UI.Dropdown]: 'absolute size-full appearance-none opacity-0',
        [UI.DropdownRoot]: 'relative inline-flex',
        [UI.Footer]: 'text-sm',
        [UI.MonthGrid]: 'relative block table-fixed border-collapse space-y-2 [&>thead]:block',
        [UI.MonthCaption]: 'flex w-full justify-center text-sm font-medium',
        [UI.MonthsDropdown]: '',
        [UI.Month]: 'grid grid-rows-[2rem_1fr] gap-4',
        [UI.Months]: 'relative flex flex-wrap gap-4',
        [UI.Nav]: '-mr-4',
        [UI.Week]: 'flex',
        [UI.Weeks]: 'block space-y-2',
        [UI.Weekday]: 'text-muted-foreground flex-1 text-sm font-normal',
        [UI.Weekdays]: 'flex',
        [UI.WeekNumber]: 'text-foreground/50 size-9 text-center text-xs',
        [UI.WeekNumberHeader]: '',
        [UI.YearsDropdown]: '',
        [SelectionState.range_start]: 'to-accent rounded-l-md bg-gradient-to-r from-transparent to-50%',
        [SelectionState.range_middle]: 'bg-accent first:rounded-l-md last:rounded-r-md',
        [SelectionState.range_end]: 'to-accent rounded-r-md bg-gradient-to-l from-transparent to-50%',
        [SelectionState.selected]: '',
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

export { Calendar, type CalendarProps, type DateRange, type Matcher };
