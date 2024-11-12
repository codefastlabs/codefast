/* eslint-disable tsdoc/syntax -- we use JSDoc syntax to generate the documentation */
import {
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  type TouchEvent,
} from 'react';

import { type DateLib, type Locale } from '@/lib/classes/date-lib';
import { type DeprecatedUI } from '@/lib/constants/ui';
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
export type DayPickerProps = PropsBase &
  (
    | PropsSingle
    | PropsSingleRequired
    | PropsMulti
    | PropsMultiRequired
    | PropsRange
    | PropsRangeRequired
    | { mode?: undefined; required?: undefined }
  );

/**
 * Props for customizing the calendar, handling localization, and managing
 * events. These exclude the selection mode props.
 */
export interface PropsBase {
  /**
   * Use ISO week dates instead of the locale setting. Setting this prop will
   * ignore `weekStartsOn` and `firstWeekContainsDate`.
   *
   * @see https://daypicker.dev/docs/localization#iso-week-dates
   * @see https://en.wikipedia.org/wiki/ISO_week_date
   */
  ISOWeek?: boolean;
  /**
   * When a selection mode is set, DayPicker will focus the first selected day
   * (if set) or today's date (if not disabled).
   *
   * Use this prop when you need to focus DayPicker after a user action, for
   * improved accessibility.
   *
   * @see https://daypicker.dev/guides/accessibility#autofocus
   */
  autoFocus?: boolean;

  /**
   * Show dropdowns to navigate between months or years.
   *
   * - `true`: display the dropdowns for both month and year
   * - `label`: display the month and the year as a label. Change the label with
   *   the `formatCaption` formatter.
   * - `month`: display only the dropdown for the months
   * - `year`: display only the dropdown for the years
   *
   * **Note:** showing the dropdown will set the start/end months
   * {@link fromYear} to 100 years ago, and {@link toYear} to the current year.
   *
   * @see https://daypicker.dev/docs/customization#caption-layouts
   */
  captionLayout?: 'label' | 'dropdown' | 'dropdown-months' | 'dropdown-years';
  /** Class name to add to the root element. */
  className?: string;
  /**
   * Change the class names used by DayPicker.
   *
   * Use this prop when you need to change the default class names — for
   * example, when importing the style via CSS modules or when using a CSS
   * framework.
   *
   * @see https://daypicker.dev/docs/styling
   */
  classNames?: Partial<ClassNames> & Partial<DeprecatedUI<string>>;
  /**
   * Change the components used for rendering the calendar elements.
   *
   * @see https://daypicker.dev/guides/custom-components
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
   * @see https://daypicker.dev/docs/navigation
   */
  defaultMonth?: Date;
  /**
   * The text direction of the calendar. Use `ltr` for left-to-right (default)
   * or `rtl` for right-to-left.
   *
   * @see https://daypicker.dev/docs/translation#rtl-text-direction
   */
  dir?: HTMLDivElement['dir'];
  /**
   * Disable the navigation between months. This prop won't hide the navigation:
   * to hide the navigation, use {@link hideNavigation}.
   *
   * @see https://daypicker.dev/docs/navigation#disablenavigation
   */
  disableNavigation?: boolean;
  /**
   * Apply the `disabled` modifier to the matching days.
   *
   * @see https://daypicker.dev/docs/selection-modes#disabling-dates
   */
  disabled?: Matcher | Matcher[] | undefined;
  /**
   * The latest month to end the month navigation.
   *
   * @see https://daypicker.dev/docs/navigation#start-and-end-dates
   */
  endMonth?: Date;
  /**
   * The day of January, which is always in the first week of the year.
   *
   * @see https://daypicker.dev/docs/localization#first-week-contains-date
   */
  firstWeekContainsDate?: 1 | 4;
  /**
   * Display always 6 weeks per each month, regardless of the month’s number of
   * weeks. Weeks will be filled with the days from the next month.
   *
   * @see https://daypicker.dev/docs/customization#fixed-weeks
   */
  fixedWeeks?: boolean;
  /**
   * Add a footer to the calendar, acting as a live region.
   *
   * Use this prop to communicate the calendar's status to screen readers.
   * Prefer strings over complex UI elements.
   *
   * @see https://daypicker.dev/guides/accessibility#footer
   */
  footer?: ReactNode | string;
  /**
   * Formatters used to format dates to strings. Use this prop to override the
   * default functions.
   *
   * @see https://daypicker.dev/docs/translation#custom-formatters
   */
  formatters?: Partial<Formatters>;

  /**
   * @deprecated This prop has been removed. Use `hidden={{ before: date }}`
   *   instead.
   * @see https://daypicker.dev/docs/navigation#start-and-end-dates
   */
  fromDate?: Date | undefined;
  /**
   * @deprecated This prop has been renamed to `startMonth`.
   * @see https://daypicker.dev/docs/navigation#start-and-end-dates
   */
  fromMonth?: Date | undefined;
  /**
   * @deprecated Use `startMonth` instead. E.g. `startMonth={new Date(year, 0)}`.
   * @see https://daypicker.dev/docs/navigation#start-and-end-dates
   */
  fromYear?: number | undefined;
  /**
   * Apply the `hidden` modifier to the matching days. Will hide them from the
   * calendar.
   *
   * @see https://daypicker.dev/guides/custom-modifiers#hidden-modifier
   */
  hidden?: Matcher | Matcher[] | undefined;

  /**
   * Hide the navigation buttons. This prop won't disable the navigation: to
   * disable the navigation, use {@link disableNavigation}.
   *
   * @see https://daypicker.dev/docs/navigation#hidenavigation
   */
  hideNavigation?: boolean;
  /**
   * Hide the row displaying the weekday row header.
   */
  hideWeekdays?: boolean;
  /** A unique id to add to the root element. */
  id?: string;
  /**
   * Labels creators to override the defaults. Use this prop to customize the
   * aria-label attributes in DayPicker.
   *
   * @see https://daypicker.dev/docs/translation#aria-labels
   */
  labels?: Partial<Labels>;
  /** Add the language tag to the container element. */
  lang?: HTMLDivElement['lang'];
  /**
   * The locale object used to localize dates. Pass a locale from
   * `react-day-picker/locale` to localize the calendar.
   *
   * @example
   *   import { es } from "react-day-picker/locale";
   *   <DayPicker locale={es} />
   *
   * @defaultValue enUS - The English locale default of `date-fns`.
   * @see https://daypicker.dev/docs/localization
   * @see https://github.com/date-fns/date-fns/tree/main/src/locale for a list of the supported locales
   */
  locale?: Partial<Locale> | undefined;
  /**
   * Enable the selection of a single day, multiple days, or a range of days.
   *
   * @see https://daypicker.dev/docs/selection-modes
   */
  mode?: Mode | undefined;
  /**
   * Add modifiers to the matching days.
   *
   * @see https://daypicker.dev/guides/custom-modifiers
   */
  modifiers?: Record<string, Matcher | Matcher[] | undefined> | undefined;
  /**
   * Change the class name for the day matching the `modifiers`.
   *
   * @see https://daypicker.dev/guides/custom-modifiers
   */
  modifiersClassNames?: ModifiersClassNames;
  /**
   * Change the class name for the day matching the {@link modifiers}.
   *
   * @see https://daypicker.dev/guides/custom-modifiers
   */
  modifiersStyles?: ModifiersStyles;
  /**
   * The month displayed in the calendar.
   *
   * As opposed to `defaultMonth`, use this prop with `onMonthChange` to change
   * the month programmatically.
   *
   * @see https://daypicker.dev/docs/navigation
   */
  month?: Date;
  /**
   * A cryptographic nonce ("number used once") which can be used by Content
   * Security Policy for the inline `style` attributes.
   */
  nonce?: HTMLDivElement['nonce'];
  /**
   * The number of displayed months.
   *
   * @defaultValue 1
   * @see https://daypicker.dev/docs/customization#multiplemonths
   */
  numberOfMonths?: number;
  /** Event handler when a day is blurred. */
  onDayBlur?: DayEventHandler<FocusEvent>;
  /** Event handler when a day is clicked. */
  onDayClick?: DayEventHandler<MouseEvent>;
  /** Event handler when a day is focused. */
  onDayFocus?: DayEventHandler<FocusEvent>;
  /** Event handler when a key is pressed on a day. */
  onDayKeyDown?: DayEventHandler<KeyboardEvent>;
  /**
   * @deprecated Use a custom `DayButton` component instead.
   */
  onDayKeyPress?: DayEventHandler<KeyboardEvent>;
  /**
   * @deprecated Use a custom `DayButton` component instead.
   */
  onDayKeyUp?: DayEventHandler<KeyboardEvent>;
  /** Event handler when the mouse enters a day. */
  onDayMouseEnter?: DayEventHandler<MouseEvent>;
  /** Event handler when the mouse leaves a day. */
  onDayMouseLeave?: DayEventHandler<MouseEvent>;
  /**
   * @deprecated Use a custom `DayButton` component instead.
   */
  onDayPointerEnter?: DayEventHandler<PointerEvent>;
  /**
   * @deprecated Use a custom `DayButton` component instead.
   */
  onDayPointerLeave?: DayEventHandler<PointerEvent>;
  /**
   * @deprecated Use a custom `DayButton` component instead.
   */
  onDayTouchCancel?: DayEventHandler<TouchEvent>;
  /**
   * @deprecated Use a custom `DayButton` component instead.
   */
  onDayTouchEnd?: DayEventHandler<TouchEvent>;
  /**
   * @deprecated Use a custom `DayButton` component instead.
   */
  onDayTouchMove?: DayEventHandler<TouchEvent>;
  /**
   * @deprecated Use a custom `DayButton` component instead.
   */
  onDayTouchStart?: DayEventHandler<TouchEvent>;
  /**
   * Event fired when the user navigates between months.
   *
   * @see https://daypicker.dev/docs/navigation#onmonthchange
   */
  onMonthChange?: MonthChangeEventHandler;
  /**
   * Event handler when the next month button is clicked.
   *
   * @see https://daypicker.dev/docs/navigation
   */
  onNextClick?: MonthChangeEventHandler;

  /**
   * Event handler when the previous month button is clicked.
   *
   * @see https://daypicker.dev/docs/navigation
   */
  onPrevClick?: MonthChangeEventHandler;

  /**
   * Event handler when a week number is clicked.
   * @deprecated Use a custom `WeekNumber` component instead.
   * @see https://daypicker.dev/docs/customization#showweeknumber
   */

  onWeekNumberClick?: never;
  /**
   * Paginate the month navigation displaying the `numberOfMonths` at a time.
   *
   * @see https://daypicker.dev/docs/customization#multiplemonths
   */
  pagedNavigation?: boolean;
  /**
   * Whether the selection is required.
   *
   * @see https://daypicker.dev/docs/selection-modes
   */
  required?: boolean | undefined;

  /**
   * Render the months in reversed order (when {@link numberOfMonths} is set) to
   * display the most recent month first.
   *
   * @see https://daypicker.dev/docs/customization#multiplemonths
   */
  reverseMonths?: boolean;
  /**
   * Show the outside days (days falling in the next or the previous month).
   *
   * @see https://daypicker.dev/docs/customization#outside-days
   */
  showOutsideDays?: boolean;
  /**
   * Show the week numbers column. Weeks are numbered according to the local
   * week index.
   *
   * - To use ISO week numbering, use the `ISOWeek` prop.
   * - To change how the week numbers are displayed, use the `formatters` prop.
   *
   * @see https://daypicker.dev/docs/customization#showweeknumber
   */
  showWeekNumber?: boolean;
  /**
   * The earliest month to start the month navigation.
   *
   * @see https://daypicker.dev/docs/navigation#start-and-end-dates
   */
  startMonth?: Date | undefined;
  /** Style to apply to the root element. */
  style?: CSSProperties;
  /**
   * Change the inline styles of the HTML elements.
   *
   * @see https://daypicker.dev/docs/styling
   */
  styles?: Partial<Styles> & Partial<DeprecatedUI<CSSProperties>>;

  /**
   * The time zone (IANA or UTC offset) to use in the calendar (experimental).
   * See
   * [Wikipedia](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)
   * for the possible values.
   *
   * Time zones are supported by the `TZDate` object by the
   * [@date-fns/tz](https://github.com/date-fns/tz) package. Please refer to the
   * package documentation for more information.
   *
   * @experimental
   * @see https://daypicker.dev/docs/time-zone
   */
  timeZone?: string | undefined;

  /** Add a `title` attribute to the container element. */
  title?: HTMLDivElement['title'];
  /**
   * @deprecated This prop has been removed. Use `hidden={{ after: date }}`
   *   instead.
   * @see https://daypicker.dev/docs/navigation#start-and-end-dates
   */
  toDate?: Date;
  /**
   * @deprecated This prop has been renamed to `endMonth`.
   * @see https://daypicker.dev/docs/navigation#start-and-end-dates
   */
  toMonth?: Date;
  /**
   * @deprecated Use `endMonth` instead. E.g. `endMonth={new Date(year, 0)}`.
   * @see https://daypicker.dev/docs/navigation#start-and-end-dates
   */
  toYear?: number;
  /**
   * The today’s date. Default is the current date. This date will get the
   * `today` modifier to style the day.
   *
   * @see https://daypicker.dev/guides/custom-modifiers#today-modifier
   */
  today?: Date;
  /**
   * Enable `YY` and `YYYY` for day of year tokens when formatting or parsing
   * dates.
   *
   * @see https://date-fns.org/docs/Unicode-Tokens
   */
  useAdditionalDayOfYearTokens?: boolean | undefined;
  /**
   * Enable `DD` and `DDDD` for week year tokens when formatting or parsing
   * dates.
   *
   * @see https://date-fns.org/docs/Unicode-Tokens
   */
  useAdditionalWeekYearTokens?: boolean | undefined;
  /**
   * The index of the first day of the week (0 - Sunday). Overrides the locale's
   * one.
   *
   * @see https://daypicker.dev/docs/localization#first-date-of-the-week
   */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | undefined;
}

/**
 * OnSelectHandler is a type definition for a callback function triggered upon a selection event.
 *
 * It handles selection logic by receiving the selected item, the date when the selection was triggered,
 * various modifiers related to the selection, and the event that invoked the selection (either mouse or keyboard
 * event).
 *
 * @typeParam T - The type representing the selected item.
 *
 * @param selected - The item that was selected.
 * @param triggerDate - The date and time when the selection event occurred.
 * @param modifiers - An object containing flags or additional information about the selection state.
 * @param event - The event object representing the mouse or keyboard event that triggered the selection.
 */
export type OnSelectHandler<T> = (
  selected: T,
  triggerDate: Date,
  modifiers: Modifiers,
  event: MouseEvent | KeyboardEvent,
) => void;

/**
 * The props when the single selection is required.
 */
export interface PropsSingleRequired {
  mode: 'single';
  required: true;
  /** The selected date. */
  selected: Date | undefined;
  /** Event handler when a day is selected. */
  onSelect?: OnSelectHandler<Date>;
}

/**
 * The props when the single selection is optional.
 */
export interface PropsSingle {
  mode: 'single';
  /** Event handler when a day is selected. */
  onSelect?: OnSelectHandler<Date | undefined>;
  required?: false | undefined;
  /** The selected date. */
  selected?: Date | undefined;
}

/**
 * The props when the multiple selection is required.
 */
export interface PropsMultiRequired {
  mode: 'multiple';
  required: true;
  /** The selected dates. */
  selected: Date[] | undefined;
  /** The maximum number of selectable days. */
  max?: number;
  /** The minimum number of selectable days. */
  min?: number;
  /** Event handler when days are selected. */
  onSelect?: OnSelectHandler<Date[]>;
}

/**
 * The props when the multiple selection is optional.
 */
export interface PropsMulti {
  mode: 'multiple';
  /** The maximum number of selectable days. */
  max?: number;
  /** The minimum number of selectable days. */
  min?: number;
  /** Event handler when days are selected. */
  onSelect?: OnSelectHandler<Date[] | undefined>;
  required?: false | undefined;
  /** The selected dates. */
  selected?: Date[] | undefined;
}
/**
 * The props when the range selection is required.
 */
export interface PropsRangeRequired {
  mode: 'range';
  required: true;
  /** The selected range. */
  selected: DateRange | undefined;
  disabled?: Matcher | Matcher[] | undefined;
  /**
   * When `true`, the range will reset when including a disabled day.
   */
  excludeDisabled?: boolean | undefined;
  /** The maximum number of days to include in the range. */
  max?: number;
  /** The minimum number of days to include in the range. */
  min?: number;
  /** Event handler when a range is selected. */
  onSelect?: OnSelectHandler<DateRange>;
}
/**
 * The props when the range selection is optional.
 */
export interface PropsRange {
  mode: 'range';
  disabled?: Matcher | Matcher[] | undefined;
  /**
   * When `true`, the range will reset when including a disabled day.
   */
  excludeDisabled?: boolean | undefined;
  /** The maximum number of days to include in the range. */
  max?: number;
  /** The minimum number of days to include in the range. */
  min?: number;
  /** Event handler when the selection changes. */
  onSelect?: OnSelectHandler<DateRange | undefined>;
  required?: false | undefined;
  /** The selected range. */
  selected?: DateRange | undefined;
}
