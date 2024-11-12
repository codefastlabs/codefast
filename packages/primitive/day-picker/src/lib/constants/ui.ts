/* eslint-disable @typescript-eslint/naming-convention -- we use lower case for the enums */

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
