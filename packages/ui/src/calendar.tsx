"use client";

import * as React from "react";
import { type DateRange, DayPicker, type DayPickerProps, type StyledComponent } from "react-day-picker";
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { buttonVariants } from "./button";
import { cn } from "./utils";

/* -----------------------------------------------------------------------------
 * Component: Calendar
 * -------------------------------------------------------------------------- */

function ChevronLeft({ children: _, ...props }: StyledComponent): React.JSX.Element {
  return <ChevronLeftIcon className="size-4" {...props} />;
}

function ChevronRight({ children: _, ...props }: StyledComponent): React.JSX.Element {
  return <ChevronRightIcon className="size-4" {...props} />;
}

type CalendarProps = DayPickerProps;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps): React.JSX.Element {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: buttonVariants({
          variant: "outline",
          className: "size-7 bg-transparent p-0 opacity-50 hover:opacity-100",
        }),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-muted-foreground rounded-md w-8 font-normal text-xs",
        row: "flex w-full mt-2",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-range-end)]:rounded-r-md",
          props.mode === "range"
            ? "[&:has(>.day-range-start)]:rounded-l-md [&:has(>.day-range-end)]:rounded-r-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md",
        ),
        day: buttonVariants({
          variant: "ghost",
          className: "size-9 p-0 font-normal aria-selected:opacity-100",
        }),
        day_range_start: "day-range-start",
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ChevronLeft,
        IconRight: ChevronRight,
      }}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Calendar, type CalendarProps, type DateRange };
