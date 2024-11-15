import { type CSSProperties, type FocusEvent, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';

import { type DateLib, type Locale } from '@/lib/classes/date-lib';
import {
  type ClassNames,
  type CustomComponents,
  type DateRange,
  type DayEventHandler,
  type Formatters,
  type Labels,
  type Matcher,
  type Mode,
  type Modifiers,
  type ModifiersClassNames,
  type ModifiersStyles,
  type MonthChangeEventHandler,
  type Styles,
} from '@/lib/types/shared';

/**
 * The props for the `<DayPicker />` component.
 */
export type DayPickerProps = BaseProps &
  (
    | SingleProps
    | SingleRequiredProps
    | MultiProps
    | MultiRequiredProps
    | RangeProps
    | RangeRequiredProps
    | { mode?: undefined; required?: undefined }
  );

export type DayEvent = MouseEvent | KeyboardEvent;

/**
 * Props for customizing the calendar, handling localization, and managing
 * events. These exclude the selection mode props.
 */
export interface BaseProps {
  /**
   * Use ISO week dates instead of the locale setting. Setting this prop will
   * ignore `weekStartsOn` and `firstWeekContainsDate`.
   *
   * @see https://en.wikipedia.org/wiki/ISO_week_date
   */
  ISOWeek?: boolean;

  /**
   * When a selection mode is set, DayPicker will focus on the first selected day
   * (if set) or today's date (if not disabled).
   *
   * Use this prop when you need to focus DayPicker after a user action, for
   * improved accessibility.
   */
  autoFocus?: boolean;

  /**
   * Show dropdowns to navigate between months or years.
   *
   * - `true`: display the dropdowns for both month and year
   * - `label`: display the month and the year as a label.
   * Change the label with the `formatCaption` formatter.
   * - `month`: display only the dropdown for the months
   * - `year`: display only the dropdown for the years
   *
   * **Note:** showing the dropdown will set the start/end months
   * {@link fromYear} to 100 years ago, and {@link toYear} to the current year.
   */
  captionLayout?: 'label' | 'dropdown' | 'dropdown-months' | 'dropdown-years';

  /**
   * Class name to add to the root element.
   */
  className?: string;

  /**
   * Change the class names used by DayPicker.
   *
   * Use this prop when you need to change the default class names — for
   * example, when importing the style via CSS modules or when using a CSS
   * framework.
   */
  classNames?: Partial<ClassNames>;

  /**
   * Change the components used for rendering the calendar elements.
   */
  components?: Partial<CustomComponents>;

  /**
   * Replace the default date library with a custom one. Experimental: not
   * guaranteed to be stable (may not respect semver).
   *
   * @experimental
   */
  dateLib?: Partial<typeof DateLib.prototype> | undefined;

  /**
   * The initial month to show in the calendar.
   *
   * Use this prop to let DayPicker control the current month. If you need to
   * set the month programmatically, use {@link month} and {@link onMonthChange}.
   *
   * @defaultValue The current month
   */
  defaultMonth?: Date;

  /**
   * The text direction of the calendar. Use `ltr` for left-to-right (default)
   * or `rtl` for right-to-left.
   */
  dir?: HTMLDivElement['dir'];

  /**
   * Disable the navigation between months. This prop won't hide the navigation:
   * to hide the navigation, use {@link hideNavigation}.
   */
  disableNavigation?: boolean;

  /**
   * Apply the `disabled` modifier to the matching days.
   */
  disabled?: Matcher | Matcher[] | undefined;

  /**
   * The latest month to end the month navigation.
   * If used for an end year, use `endMonth={new Date(year, 0)}`.
   */
  endMonth?: Date;

  /**
   * The day of January, which is always in the first week of the year.
   */
  firstWeekContainsDate?: 1 | 4;

  /**
   * Display always 6 weeks per each month, regardless of the month’s number of weeks. Weeks will be filled with the
   * days from the next month.
   */
  fixedWeeks?: boolean;

  /**
   * Add a footer to the calendar, acting as a live region.
   *
   * Use this prop to communicate the calendar's status to screen readers.
   * Prefer strings to complex UI elements.
   */
  footer?: ReactNode | string;

  /**
   * Formatters used to format dates to strings. Use this prop to override the default functions.
   */
  formatters?: Partial<Formatters>;

  /**
   * @deprecated This prop has been removed. Use `hidden={{ before: date }}` instead.
   */
  fromDate?: Date | undefined;

  /**
   * @deprecated This prop has been renamed to `startMonth`.
   */
  fromMonth?: Date | undefined;

  /**
   * @deprecated Use `startMonth` instead. E.g. `startMonth={new Date(year, 0)}`.
   */
  fromYear?: number | undefined;

  /**
   * Apply the `hidden` modifier to the matching days. Will hide them from the calendar.
   */
  hidden?: Matcher | Matcher[] | undefined;

  /**
   * Hide the navigation buttons. This prop won't disable the navigation: to disable the navigation, use
   * {@link disableNavigation}.
   */
  hideNavigation?: boolean;

  /**
   * Hide the row displaying the weekday row header.
   */
  hideWeekdays?: boolean;

  /**
   * A unique id to add to the root element.
   */
  id?: string;

  /**
   * Labels creators to override the defaults. Use this prop to customize the aria-label attributes in DayPicker.
   */
  labels?: Partial<Labels>;

  /**
   * Add the language tag to the container element.
   */
  lang?: HTMLDivElement['lang'];

  /**
   * The locale object used to localize dates. Pass a locale from
   * `react-day-picker/locale` to localize the calendar.
   *
   * @example
   * ```tsx
   *   import { es } from "react-day-picker/locale";
   *   <DayPicker locale={es} />
   * ```
   *
   * @defaultValue enUS - The English locale default of `date-fns`.
   * @see https://github.com/date-fns/date-fns/tree/main/src/locale for a list of the supported locales
   */
  locale?: Partial<Locale> | undefined;

  /**
   * Enable the selection of a single day, multiple days, or a range of days.
   */
  mode?: Mode | undefined;

  /**
   * Add modifiers to the matching days.
   */
  modifiers?: Record<string, Matcher | Matcher[] | undefined> | undefined;

  /**
   * Change the class name for the day matching the `modifiers`.
   */
  modifiersClassNames?: ModifiersClassNames;

  /**
   * Change the class name for the day matching the {@link modifiers}.
   */
  modifiersStyles?: ModifiersStyles;

  /**
   * The month displayed in the calendar.
   *
   * As opposed to `defaultMonth`, use this prop with `onMonthChange` to change the month programmatically.
   */
  month?: Date;

  /**
   * A cryptographic nonce ("number used once") which can be used by Content Security Policy for the inline `style`
   * attributes.
   */
  nonce?: HTMLDivElement['nonce'];

  /**
   * The number of displayed months.
   *
   * @defaultValue 1
   */
  numberOfMonths?: number;

  /**
   * Event handler when a day is blurred.
   */
  onDayBlur?: DayEventHandler<FocusEvent>;

  /**
   * Event handler when a day is clicked.
   */
  onDayClick?: DayEventHandler<MouseEvent>;

  /**
   * Event handler when a day is focused.
   */
  onDayFocus?: DayEventHandler<FocusEvent>;

  /**
   * Event handler when a key is pressed on a day.
   */
  onDayKeyDown?: DayEventHandler<KeyboardEvent>;

  /**
   * Event handler when the mouse enters a day.
   */
  onDayMouseEnter?: DayEventHandler<MouseEvent>;

  /**
   * Event handler when the mouse leaves a day.
   */
  onDayMouseLeave?: DayEventHandler<MouseEvent>;

  /**
   * Event fired when the user navigates between months.
   */
  onMonthChange?: MonthChangeEventHandler;

  /**
   * Event handler when the next month button is clicked.
   */
  onNextClick?: MonthChangeEventHandler;

  /**
   * Event handler when the previous month button is clicked.
   */
  onPrevClick?: MonthChangeEventHandler;

  /**
   * Paginate the month navigation displaying the `numberOfMonths` at a time.
   */
  pagedNavigation?: boolean;

  /**
   * Whether the selection is required.
   */
  required?: boolean | undefined;

  /**
   * Render the months in reversed order (when {@link numberOfMonths} is set) to display the most recent month first.
   */
  reverseMonths?: boolean;

  /**
   * Show the outside days (days falling in the next or the previous month).
   */
  showOutsideDays?: boolean;

  /**
   * Show the week numbers column.
   * Weeks are numbered according to the local week index.
   *
   * - To use ISO week numbering, use the `ISOWeek` prop.
   * - To change how the week numbers are displayed, use the `formatters` prop.
   */
  showWeekNumber?: boolean;

  /**
   * The earliest month to start the month navigation.
   * If used for a start year, use `startMonth={new Date(year, 0)}`.
   */
  startMonth?: Date | undefined;

  /**
   * Style to apply to the root element.
   */
  style?: CSSProperties;

  /**
   * Change the inline styles of the HTML elements.
   */
  styles?: Partial<Styles>;

  /**
   * The time zone (IANA or UTC offset) to use in the calendar (experimental).
   * See [Wikipedia](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) for the possible values.
   *
   * Time zones are supported by the `TZDate` object by the [\@date-fns/tz](https://github.com/date-fns/tz) package.
   * Refer to the package documentation for more information.
   *
   * @experimental
   */
  timeZone?: string | undefined;

  /**
   * Add a `title` attribute to the container element.
   */
  title?: HTMLDivElement['title'];

  /**
   * @deprecated This prop has been removed. Use `hidden={{ after: date }}` instead.
   */
  toDate?: Date;

  /**
   * @deprecated This prop has been renamed to `endMonth`.
   */
  toMonth?: Date;

  /**
   * @deprecated Use `endMonth` instead. E.g. `endMonth={new Date(year, 0)}`.
   */
  toYear?: number;

  /**
   * The today’s date. Default is the current date. This date will get the `today` modifier to style the day.
   */
  today?: Date;

  /**
   * Enable `YY` and `YYYY` for day of year tokens when formatting or parsing dates.
   *
   * @see https://date-fns.org/docs/Unicode-Tokens
   */
  useAdditionalDayOfYearTokens?: boolean | undefined;

  /**
   * Enable `DD` and `DDDD` for week year tokens when formatting or parsing dates.
   *
   * @see https://date-fns.org/docs/Unicode-Tokens
   */
  useAdditionalWeekYearTokens?: boolean | undefined;

  /**
   * The index of the first day of the week (0 - Sunday). Overrides the locale's
   * one.
   */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | undefined;
}

/**
 * OnSelectHandler is a type definition for a callback function triggered upon a selection event.
 *
 * It handles selection logic by receiving the selected item, the date when the selection was triggered, various
 * modifiers related to the selection, and the event that invoked the selection (either mouse or keyboard event).
 *
 * @typeParam T - The type representing the selected item.
 *
 * @param selected - The item that was selected.
 * @param triggerDate - The date and time when the selection event occurred.
 * @param modifiers - An object containing flags or additional information about the selection state.
 * @param event - The event object representing the mouse or keyboard event that triggered the selection.
 */
export type OnSelectHandler<T> = (selected: T, triggerDate: Date, modifiers: Modifiers, event: DayEvent) => void;

/**
 * The props when the single selection is optional.
 */
export interface SingleProps {
  mode: 'single';

  /**
   * Event handler when a day is selected.
   */
  onSelect?: OnSelectHandler<Date | undefined>;
  required?: false | undefined;

  /**
   * The selected date.
   */
  selected?: Date | undefined;
}

/**
 * The props when the single selection is required.
 */
export interface SingleRequiredProps {
  mode: 'single';
  required: true;

  /**
   * The selected date.
   */
  selected: Date | undefined;

  /**
   * Event handler when a day is selected.
   */
  onSelect?: OnSelectHandler<Date>;
}

/**
 * The props when the multiple selection is optional.
 */
export interface MultiProps {
  mode: 'multiple';

  /**
   * The maximum number of selectable days.
   */
  max?: number;

  /**
   * The minimum number of selectable days.
   */
  min?: number;

  /**
   * Event handler when days are selected.
   */
  onSelect?: OnSelectHandler<Date[] | undefined>;
  required?: false | undefined;

  /**
   * The selected dates.
   */
  selected?: Date[] | undefined;
}

/**
 * The props when multiple selection is required.
 */
export interface MultiRequiredProps {
  mode: 'multiple';
  required: true;

  /**
   * The selected dates.
   */
  selected: Date[] | undefined;

  /**
   * The maximum number of selectable days.
   */
  max?: number;

  /**
   * The minimum number of selectable days.
   */
  min?: number;

  /**
   * Event handler when days are selected.
   */
  onSelect?: OnSelectHandler<Date[]>;
}

/**
 * The props when the range selection is optional.
 */
export interface RangeProps {
  mode: 'range';
  disabled?: Matcher | Matcher[] | undefined;

  /**
   * When `true`, the range will reset when including a disabled day.
   */
  excludeDisabled?: boolean | undefined;

  /**
   * The maximum number of days to include in the range.
   */
  max?: number;

  /**
   * The minimum number of days to include in the range.
   */
  min?: number;

  /**
   * Event handler when the selection changes.
   */
  onSelect?: OnSelectHandler<DateRange | undefined>;
  required?: false | undefined;

  /**
   * The selected range.
   */
  selected?: DateRange | undefined;
}

/**
 * The props when the range selection is required.
 */
export interface RangeRequiredProps {
  mode: 'range';
  required: true;

  /**
   * The selected range.
   */
  selected: DateRange | undefined;
  disabled?: Matcher | Matcher[] | undefined;

  /**
   * When `true`, the range will reset when including a disabled day.
   */
  excludeDisabled?: boolean | undefined;

  /**
   * The maximum number of days to include in the range.
   */
  max?: number;

  /**
   * The minimum number of days to include in the range.
   */
  min?: number;

  /**
   * Event handler when a range is selected.
   */
  onSelect?: OnSelectHandler<DateRange>;
}
