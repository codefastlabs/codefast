/* eslint-disable @typescript-eslint/naming-convention -- we use lower case for the enums */
import { type CSSProperties } from 'react';

/**
 * The UI elements composing DayPicker. These elements are mapped to
 * {@link CustomComponents}, the {@link ClassNames} and the {@link Styles} used by
 * DayPicker.
 *
 * Some of these elements are extended by flags and modifiers.
 */
export enum UI {
  /** The caption label of the month (when not showing the dropdown navigation). */
  CaptionLabel = 'caption_label',
  /** The Chevron SVG element used by navigation buttons and dropdowns. */
  Chevron = 'chevron',
  /**
   * The grid cell with the day's date. Extended by {@link DayFlag} and
   * {@link SelectionState}.
   */
  Day = 'day',
  /** The button containing the formatted day's date, inside the grid cell. */
  DayButton = 'day_button',
  /** The dropdown element to select for years and months. */
  Dropdown = 'dropdown',
  /** The container element of the dropdown. */
  DropdownRoot = 'dropdown_root',
  /** The container of the dropdown navigation (when enabled). */
  Dropdowns = 'dropdowns',
  /** The root element of the footer. */
  Footer = 'footer',
  /** Wrapper of the month grid. */
  Month = 'month',
  /** Contains the dropdown navigation or the caption label. */
  MonthCaption = 'month_caption',
  /** The month grid. */
  MonthGrid = 'month_grid',
  /** The container of the displayed months. */
  Months = 'months',
  /** The dropdown with the months. */
  MonthsDropdown = 'months_dropdown',
  /** The navigation bar with the previous and next buttons. */
  Nav = 'nav',
  /**
   * The next month button in the navigation. *
   */
  NextMonthButton = 'button_next',
  /**
   * The previous month button in the navigation.
   */
  PreviousMonthButton = 'button_previous',
  /** The root component displaying the months and the navigation bar. */
  Root = 'root',
  /** The row containing the week. */
  Week = 'week',
  /** The cell containing the week number. */
  WeekNumber = 'week_number',
  /** The cell header of the week numbers column. */
  WeekNumberHeader = 'week_number_header',
  /** The column header with the weekday. */
  Weekday = 'weekday',
  /** The row grouping the weekdays in the column headers. */
  Weekdays = 'weekdays',
  /** The group of row weeks in a month (`tbody`). */
  Weeks = 'weeks',
  /** The dropdown with the years. */
  YearsDropdown = 'years_dropdown',
}

/** The flags for the {@link UI.Day}. */
export enum DayFlag {
  /** The day is disabled. */
  disabled = 'disabled',
  /** The day is focused. */
  focused = 'focused',
  /** The day is hidden. */
  hidden = 'hidden',
  /** The day is outside the current month. */
  outside = 'outside',
  /** The day is today. */
  today = 'today',
}

/**
 * The state that can be applied to the {@link UI.Day} element when in selection
 * mode.
 */
export enum SelectionState {
  /** The day is at the end of a selected range. */
  range_end = 'range_end',
  /** The day is at the middle of a selected range. */
  range_middle = 'range_middle',
  /** The day is at the start of a selected range. */
  range_start = 'range_start',
  /** The day is selected. */
  selected = 'selected',
}

/**
 * Deprecated UI elements and flags.
 *
 * These elements were used in a previous version of DayPicker and are kept here
 * to help the transition to the new {@link UI | UI elements}.
 *
 * ```diff
 *   <DayPicker classNames={{
 * -  cell: "my-cell",
 * +  day: "my-cell",
 * -  day: "my-day",
 * +  day_button: "my-day",
 * -  day_disabled: "my-day_disabled",
 * +  disabled: "my-day_disabled",
 *    // etc.
 *   }}/>
 * ```
 *
 * @deprecated - Use the new {@link UI} elements instead.
 */
export interface DeprecatedUI<T extends CSSProperties | string> {
  /**
   * This element was applied to the style of any button in DayPicker, and it is
   * replaced by {@link UI.PreviousMonthButton} and {@link UI.NextMonthButton}.
   *
   * @deprecated - Use {@link UI.PreviousMonthButton} and {@link UI.NextMonthButton} instead.
   */
  button: T;
  /**
   * This element was resetting the style of any button in DayPicker, and it is
   * replaced by {@link UI.PreviousMonthButton} and {@link UI.NextMonthButton}.
   *
   * @deprecated - Use {@link UI.PreviousMonthButton} and {@link UI.NextMonthButton} instead.
   */
  button_reset: T;
  /**
   * This element has been renamed to {@link UI.MonthCaption}.
   *
   * @deprecated - Use {@link UI.MonthCaption} instead.
   */
  caption: T;
  /**
   * This element has been removed. Captions are styled via
   * {@link UI.MonthCaption}.
   *
   * @deprecated - Use {@link UI.MonthCaption} instead.
   */
  caption_between: T;
  /**
   * This element has been renamed to {@link UI.Dropdowns}.
   *
   * @deprecated - Use {@link UI.Dropdowns} instead.
   */
  caption_dropdowns: T;
  /**
   * This element has been removed. Captions are styled via
   * {@link UI.MonthCaption}.
   *
   * @deprecated - Use {@link UI.MonthCaption} instead.
   */
  caption_end: T;
  /**
   * This element has been removed.
   *
   * @deprecated - No replacement.
   */
  caption_start: T;
  /**
   * This element has been renamed to {@link UI.Day}.
   *
   * @deprecated - Use {@link UI.Day} instead.
   */
  cell: T;
  /**
   * This element has been renamed to {@link DayFlag.disabled}.
   *
   * @deprecated - Use {@link DayFlag.disabled} instead.
   */
  day_disabled: T;
  /**
   * This element has been renamed to {@link DayFlag.hidden}.
   *
   * @deprecated - Use {@link DayFlag.hidden} instead.
   */
  day_hidden: T;
  /**
   * This element has been renamed to {@link DayFlag.outside}.
   *
   * @deprecated - Use {@link DayFlag.outside} instead.
   */
  day_outside: T;
  /**
   * This element has been renamed to {@link SelectionState.range_end}.
   *
   * @deprecated - Use {@link SelectionState.range_end} instead.
   */
  day_range_end: T;
  /**
   * This element has been renamed to {@link SelectionState.range_middle}.
   *
   * @deprecated - Use {@link SelectionState.range_middle} instead.
   */
  day_range_middle: T;
  /**
   * This element has been renamed to {@link SelectionState.range_start}.
   *
   * @deprecated - Use {@link SelectionState.range_start} instead.
   */
  day_range_start: T;
  /**
   * This element has been renamed to {@link SelectionState.selected}.
   *
   * @deprecated - Use {@link SelectionState.selected} instead.
   */
  day_selected: T;
  /**
   * This element has been renamed to {@link DayFlag.today}.
   *
   * @deprecated - Use {@link DayFlag.today} instead.
   */
  day_today: T;
  /**
   * This element has been removed. The dropdown icon is now {@link UI.Chevron}
   * inside a {@link UI.CaptionLabel}.
   *
   * @deprecated - Use {@link UI.Chevron} instead.
   */
  dropdown_icon: T;
  /**
   * This element has been renamed to {@link UI.MonthsDropdown}.
   *
   * @deprecated - Use {@link UI.MonthsDropdown} instead.
   */
  dropdown_month: T;
  /**
   * This element has been renamed to {@link UI.YearsDropdown}.
   *
   * @deprecated - Use {@link UI.YearsDropdown} instead.
   */
  dropdown_year: T;
  /**
   * This element has been removed.
   *
   * @deprecated - No replacement.
   */
  head: T;
  /**
   * This element has been renamed to {@link UI.Weekday}.
   *
   * @deprecated - Use {@link UI.Weekday} instead.
   */
  head_cell: T;
  /**
   * This element has been renamed to {@link UI.Weekdays}.
   *
   * @deprecated - Use {@link UI.Weekdays} instead.
   */
  head_row: T;
  /**
   * This flag has been removed. Use `data-multiple-months` in your CSS
   * selectors.
   *
   * @deprecated - Use `data-multiple-months` in your CSS selectors.
   */
  multiple_months: T;
  /**
   * This element has been removed. To style the navigation buttons, use
   * {@link UI.PreviousMonthButton} and {@link UI.NextMonthButton}.
   *
   * @deprecated - Use {@link UI.PreviousMonthButton} and {@link UI.NextMonthButton} instead.
   */
  nav_button: T;
  /**
   * This element has been renamed to {@link UI.NextMonthButton}.
   *
   * @deprecated - Use {@link UI.NextMonthButton} instead.
   */
  nav_button_next: T;
  /**
   * This element has been renamed to {@link UI.PreviousMonthButton}.
   *
   * @deprecated - Use {@link UI.PreviousMonthButton} instead.
   */
  nav_button_previous: T;
  /**
   * This element has been removed. The dropdown icon is now {@link UI.Chevron}
   * inside a {@link UI.NextMonthButton} or a {@link UI.PreviousMonthButton}.
   *
   * @deprecated - Use {@link UI.Chevron} instead.
   */
  nav_icon: T;
  /**
   * This element has been renamed to {@link UI.Week}.
   *
   * @deprecated - Use {@link UI.Week} instead.
   */
  row: T;
  /**
   * This element has been renamed to {@link UI.MonthGrid}.
   *
   * @deprecated - Use {@link UI.MonthGrid} instead.
   */
  table: T;
  /**
   * This element has been renamed to {@link UI.Weeks}.
   *
   * @deprecated - Use {@link UI.Weeks} instead.
   */
  tbody: T;
  /**
   * This element has been removed. The {@link UI.Footer} is now a single element
   * below the months.
   *
   * @deprecated - No replacement.
   */
  tfoot: T;
  /**
   * This flag has been removed. There are no "visually hidden" elements in
   * DayPicker 9.
   *
   * @deprecated - No replacement.
   */
  vhidden: T;
  /**
   * This element has been renamed. Use {@link UI.WeekNumber} instead.
   *
   * @deprecated - Use {@link UI.WeekNumber} instead.
   */
  weeknumber: T;
  /**
   * This flag has been removed. Use `data-week-numbers` in your CSS.
   *
   * @deprecated - Use `data-week-numbers` in your CSS.
   */
  with_weeknumber: T;
}
