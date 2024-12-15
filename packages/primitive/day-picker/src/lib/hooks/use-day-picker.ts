import { createContext, useContext } from 'react';

import type { CalendarDay } from '@/lib/classes/calendar-day';
import type { CalendarMonth } from '@/lib/classes/calendar-month';
import type {
  ClassNames,
  Components,
  DayPickerProps,
  Formatters,
  Labels,
  Mode,
  Modifiers,
  SelectedValue,
  SelectHandler,
  Styles,
} from '@/lib/types';

export const dayPickerContext = createContext<
  | DayPickerContext<{
      mode?: Mode | undefined;
      required?: boolean | undefined;
    }>
  | undefined
>(undefined);

/**
 * Represents the context for the DayPicker component,
 * providing various properties and methods to interact with the calendar.
 *
 * @typeParam T - A type extending an object with optional `mode` and `required` properties.
 */
export interface DayPickerContext<T extends { mode?: Mode | undefined; required?: boolean | undefined }> {
  /**
   * The class names for the UI elements.
   */
  classNames: ClassNames;

  /**
   * The components used internally by DayPicker.
   */
  components: Components;

  /**
   * The props as passed to the DayPicker component.
   */
  dayPickerProps: DayPickerProps;

  /**
   * The formatters used to format the UI elements.
   */
  formatters: Formatters;

  /**
   * Returns the modifiers for the given day.
   */
  getModifiers: (day: CalendarDay) => Modifiers;

  /**
   * Navigate to the specified month. Will fire the `onMonthChange` callback.
   */
  goToMonth: (month: Date) => void;

  /**
   * Whether the given date is selected.
   */
  isSelected: ((date: Date) => boolean) | undefined;

  /**
   * The labels used in the user interface.
   */
  labels: Labels;

  /**
   * The months displayed in the calendar.
   */
  months: CalendarMonth[];

  /**
   * The next month to display.
   */
  nextMonth: Date | undefined;

  /**
   * The previous month to display.
   */
  previousMonth: Date | undefined;

  /**
   * Set a selection.
   */
  select: SelectHandler<T> | undefined;

  /**
   * The selected date.
   */
  selected: SelectedValue<T> | undefined;

  /**
   * The styles for the UI elements.
   */
  styles: Partial<Styles> | undefined;
}

/**
 * Returns the context to work with `<DayPicker />` inside custom components.
 *
 * This hook provides access to the DayPicker context,
 * which includes various properties and methods to interact with the DayPicker component.
 * It must be used within a custom component.
 *
 * @typeParam T - The type parameter that extends an object with optional `mode` and `required` properties.
 * @returns The DayPicker context.
 * @throws Error if the hook is used outside a component that provides the DayPicker context.
 */
export function useDayPicker<
  T extends { mode?: Mode | undefined; required?: boolean | undefined },
>(): DayPickerContext<T> {
  const context = useContext(dayPickerContext);

  if (context === undefined) {
    throw new Error('useDayPicker() must be used within a custom component.');
  }

  return context;
}
