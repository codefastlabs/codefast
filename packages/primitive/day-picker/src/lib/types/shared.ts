import { type CSSProperties } from 'react';

import { type DayFlag, type SelectionState, type UI } from '@/lib/constants/ui';
import {
  type formatCaption,
  type formatDay,
  type formatMonthDropdown,
  type formatWeekdayName,
  type formatWeekNumber,
  type formatWeekNumberHeader,
  type formatYearDropdown,
} from '@/lib/formatters';
import {
  type labelDayButton,
  type labelGrid,
  type labelGridcell,
  type labelMonthDropdown,
  type labelNav,
  type labelNext,
  type labelPrevious,
  type labelWeekday,
  type labelWeekNumber,
  type labelWeekNumberHeader,
  type labelYearDropdown,
} from '@/lib/labels';

import type * as components from '@/components/ui';

/**
 * Selection modes supported by DayPicker.
 *
 * - `single`: use DayPicker to select single days.
 * - `multiple`: allow selecting multiple days.
 * - `range`: use DayPicker to select a range of days.
 */
export type Mode = 'single' | 'multiple' | 'range';

/**
 * The components that can be changed using the `components` prop.
 */
export interface Components {
  /**
   * Render the caption label of the month grid.
   */
  CaptionLabel: typeof components.CaptionLabel;

  /**
   * Render the chevron icon used in the navigation buttons and dropdowns.
   */
  Chevron: typeof components.Chevron;

  /**
   * Render the day cell in the month grid.
   */
  Day: typeof components.Day;

  /**
   * Render the button containing the day in the day cell.
   */
  DayButton: typeof components.DayButton;

  /**
   * Render the dropdown element to select years and months.
   */
  Dropdown: typeof components.Dropdown;

  /**
   * Render the container of the dropdowns.
   */
  DropdownNav: typeof components.DropdownNav;

  /**
   * Render the footer element announced by screen readers.
   */
  Footer: typeof components.Footer;

  /**
   * Render the container of the MonthGrid.
   */
  Month: typeof components.Month;

  /**
   * Render the caption of the month grid.
   */
  MonthCaption: typeof components.MonthCaption;

  /**
   * Render the grid of days in a month.
   */
  MonthGrid: typeof components.MonthGrid;

  /**
   * Wrapper of the month grids.
   */
  Months: typeof components.Months;

  /**
   * Render the dropdown with the months.
   */
  MonthsDropdown: typeof components.MonthsDropdown;

  /**
   * Render the navigation element with the next and previous buttons.
   */
  Nav: typeof components.Nav;

  /**
   * Render the next month button element in the navigation.
   */
  NextMonthButton: typeof components.NextMonthButton;

  /**
   * Render the `<option>` HTML element in the dropdown.
   */
  Option: typeof components.Option;

  /**
   * Render the previous month button element in the navigation.
   */
  PreviousMonthButton: typeof components.PreviousMonthButton;

  /**
   * Render the root element of the calendar.
   */
  Root: typeof components.Root;

  /**
   * Render the select element in the dropdowns.
   */
  Select: typeof components.Select;

  /**
   * Render the week rows.
   */
  Week: typeof components.Week;

  /**
   * Render the cell with the number of the week.
   */
  WeekNumber: typeof components.WeekNumber;

  /**
   * Render the header of the week number column.
   */
  WeekNumberHeader: typeof components.WeekNumberHeader;

  /**
   * Render the weekday name in the header.
   */
  Weekday: typeof components.Weekday;

  /**
   * Render the row containing the week days.
   */
  Weekdays: typeof components.Weekdays;

  /**
   * Render the weeks section in the month grid.
   */
  Weeks: typeof components.Weeks;

  /**
   * Render the dropdown with the years.
   */
  YearsDropdown: typeof components.YearsDropdown;
}

/**
 * Represent a map of formatters used to render localized content.
 */
export interface Formatters {
  /**
   * Format the caption of a month grid.
   */
  formatCaption: typeof formatCaption;

  /**
   * Format the day in the day cell.
   */
  formatDay: typeof formatDay;

  /**
   * Format the label in the month dropdown.
   */
  formatMonthDropdown: typeof formatMonthDropdown;

  /**
   * Format the week number.
   */
  formatWeekNumber: typeof formatWeekNumber;

  /**
   * Format the header of the week number column.
   */
  formatWeekNumberHeader: typeof formatWeekNumberHeader;

  /**
   * Format the week day name in the header.
   */
  formatWeekdayName: typeof formatWeekdayName;

  /**
   * Format the label in the year dropdown.
   */
  formatYearDropdown: typeof formatYearDropdown;
}

/**
 * Map of functions to translate ARIA labels for the relative elements.
 */
export interface Labels {
  /**
   * The label for the day button.
   */
  labelDayButton: typeof labelDayButton;

  /**
   * The label for the month grid.
   */
  labelGrid: typeof labelGrid;

  /**
   * The label for the gridcell, when the calendar is not interactive.
   */
  labelGridcell: typeof labelGridcell;

  /**
   * The label for the month dropdown.
   */
  labelMonthDropdown: typeof labelMonthDropdown;

  /**
   * The label for the navigation toolbar.
   */
  labelNav: typeof labelNav;

  /**
   * The label for the "next month" button.
   */
  labelNext: typeof labelNext;

  /**
   * The label for the "previous month" button.
   */
  labelPrevious: typeof labelPrevious;

  /**
   * The label for the week number.
   */
  labelWeekNumber: typeof labelWeekNumber;

  /**
   * Return the label for the column of the week number.
   */
  labelWeekNumberHeader: typeof labelWeekNumberHeader;

  /**
   * The label for the weekday.
   */
  labelWeekday: typeof labelWeekday;

  /**
   * The label for the year dropdown.
   */
  labelYearDropdown: typeof labelYearDropdown;
}

/**
 * A value or a function that matches a specific day.
 *
 * @example
 * ```tsx
 *   // will always match the day
 *   const booleanMatcher: Matcher = true;
 *
 *   // will match the today's date
 *   const dateMatcher: Matcher = new Date();
 *
 *   // will match the days in the array
 *   const arrayMatcher: Matcher = [
 *     new Date(2019, 1, 2),
 *     new Date(2019, 1, 4)
 *   ];
 *
 *   // will match days after the 2nd of February 2019
 *   const afterMatcher: DateAfter = { after: new Date(2019, 1, 2) };
 *
 *   // will match days before the 2nd of February 2019
 *   const beforeMatcher: DateBefore = { before: new Date(2019, 1, 2) };
 *
 *   // will match Sundays
 *   const dayOfWeekMatcher: DayOfWeek = {
 *     dayOfWeek: 0
 *   };
 *
 *   // will match the included days, except the two dates
 *   const intervalMatcher: DateInterval = {
 *     after: new Date(2019, 1, 2),
 *     before: new Date(2019, 1, 5)
 *   };
 *
 *   // will match the included days, including the two dates
 *   const rangeMatcher: DateRange = {
 *     from: new Date(2019, 1, 2),
 *     to: new Date(2019, 1, 5)
 *   };
 *
 *   // will match when the function return true
 *   const functionMatcher: Matcher = (day: Date) => {
 *     return day.getMonth() === 2; // match when month is March
 *   };
 * ```
 */
export type Matcher =
  | boolean
  | ((date: Date) => boolean)
  | Date
  | Date[]
  | DateRange
  | DateBefore
  | DateAfter
  | DateInterval
  | DayOfWeek;

/**
 * Match a day falling after the specified date, with the date not included.
 *
 * @example
 * ```tsx
 *   // Match days after the 2nd of February 2019
 *   const matcher: DateAfter = { after: new Date(2019, 1, 2) };
 * ```
 */
export interface DateAfter {
  after: Date;
}

/**
 * Match a day falling before the specified date, with the date not included.
 *
 * @example
 * ```tsx
 *   // Match days before the 2nd of February 2019
 *   const matcher: DateBefore = { before: new Date(2019, 1, 2) };
 * ```
 */
export interface DateBefore {
  before: Date;
}

/**
 * An interval of dates. Differently from {@link DateRange}, the range ends here aren't included.
 *
 * @example
 * ```tsx
 *   // Match the days between the 2nd and the 5th of February 2019
 *   const matcher: DateInterval = {
 *     after: new Date(2019, 1, 2),
 *     before: new Date(2019, 1, 5)
 *   };
 * ```
 */
export interface DateInterval {
  after: Date;
  before: Date;
}

/**
 * A range of dates. The range can be open. Differently from
 * {@link DateInterval}, the range ends here are included.
 *
 * @example
 * ```tsx
 *   // Match the days between the 2nd and the 5th of February 2019
 *   const matcher: DateRange = {
 *     from: new Date(2019, 1, 2),
 *     to: new Date(2019, 1, 5)
 *   };
 * ```
 */
export interface DateRange {
  from: Date | undefined;
  to?: Date | undefined;
}

/**
 * Match dates being one of the specified days of the week (`0-6`, where `0` is
 * Sunday).
 *
 * @example
 * ```tsx
 *   // Match Sundays
 *   const matcher: DayOfWeek = { dayOfWeek: 0 };
 *   // Match weekends
 *   const matcher: DayOfWeek = { dayOfWeek: [0, 6] };
 * ```
 */
export interface DayOfWeek {
  dayOfWeek: number | number[];
}

/**
 * The event handler triggered when clicking or interacting with a day.
 *
 * @typeParam EventType - The type of the event object.
 *
 * @param date - The date on which the event occurs.
 * @param modifiers - An object containing modifiers for the event.
 * @param event - The event object containing details about the event.
 */
export type DayEventHandler<EventType> = (date: Date, modifiers: Modifiers, event: EventType) => void;

/**
 * The event handler when a month is changed in the calendar.
 *
 * ```tsx
 * <DayPicker onMonthChange={(month) => console.log(month)} />
 * ```
 */
export type MonthChangeEventHandler = (month: Date) => void;

/**
 * The CSS classnames to use for the {@link UI} elements, the
 * {@link SelectionState} and the {@link DayFlag}.
 *
 * @example
 * ```tsx
 *   const classNames: ClassNames = {
 *     [UI.Root]: "root",
 *     [UI.Outside]: "outside",
 *     [UI.Nav]: "nav"
 *     // etc.
 *   };
 * ```
 */
export type ClassNames = Record<UI | SelectionState | DayFlag, string>;

/**
 * The CSS styles to use for the {@link UI} elements, the {@link SelectionState}
 * and the {@link DayFlag}.
 */
export type Styles = Record<UI | SelectionState | DayFlag, CSSProperties | undefined>;

/**
 * Represents the modifiers that match a specific day in the calendar.
 *
 * - Retrieve modifiers using the {@link OnSelectHandler} via the `onSelect` prop,
 *   or within custom components using the {@link useDayPicker} hook.
 * - Includes built-in modifiers from {@link DayFlag} and {@link SelectionState}.
 * - Add custom modifiers using the `modifiers` prop.
 *
 * @example
 * ```tsx
 *   const modifiers: Modifiers = {
 *   today: false, // the day is not today
 *   selected: true, // the day is selected
 *   disabled: false, // the day is not disabled
 *   outside: false, // the day is not outside the month
 *   focused: false, // the day is not focused
 *
 *   weekend: false // custom modifier example for matching a weekend
 *   booked: true // custom modifier example for matching a booked day
 *   available: false // custom modifier example for matching an available day
 *   };
 * ```
 */
export type Modifiers = Record<string, boolean>;

/**
 * The style to apply to each day element matching a modifier.
 *
 * @example
 * ```tsx
 *   const modifiersStyles: ModifiersStyles = {
 *     today: { color: "red" },
 *     selected: { backgroundColor: "blue" },
 *     weekend: { color: "green" }
 *   };
 * ```
 */
export type ModifiersStyles = Record<string, CSSProperties>;

/**
 * The classnames to assign to each day element matching a modifier.
 *
 * @example
 * ```tsx
 *   const modifiersClassNames: ModifiersClassNames = {
 *     today: "today", // Use the "today" class for the today's day
 *     selected: "highlight", // Use the "highlight" class for the selected day
 *     weekend: "weekend" // Use the "weekend" class for the weekend days
 *   };
 * ```
 */
export type ModifiersClassNames = Record<string, string>;

/**
 * The direction to move the focus relative to the current focused date.
 */
export type MoveFocusDir = 'after' | 'before';

/**
 * The temporal unit to move the focus by.
 */
export type MoveFocusBy = 'day' | 'week' | 'startOfWeek' | 'endOfWeek' | 'month' | 'year';
