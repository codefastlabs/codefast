import {
  type JSX,
  useCallback,
  useMemo,
  type ChangeEventHandler,
  type MouseEvent,
  type FocusEvent,
  type KeyboardEvent,
} from 'react';

import { type CalendarDay } from '@/classes/calendar-day';
import { DateLib, defaultLocale } from '@/classes/date-lib';
import { getClassNamesForModifiers } from '@/helpers/get-class-names-for-modifiers';
import { getComponents } from '@/helpers/get-components';
import { getDataAttributes } from '@/helpers/get-data-attributes';
import { getDefaultClassNames } from '@/helpers/get-default-class-names';
import { getFormatters } from '@/helpers/get-formatters';
import { getMonthOptions } from '@/helpers/get-month-options';
import { getStyleForModifiers } from '@/helpers/get-style-for-modifiers';
import { getWeekdays } from '@/helpers/get-weekdays';
import { getYearOptions } from '@/helpers/get-year-options';
import * as defaultLabels from '@/labels';
import {
  type DayPickerProps,
  type Modifiers,
  type MoveFocusBy,
  type MoveFocusDir,
  type SelectedValue,
  type SelectHandler,
} from '@/types';
import { UI, DayFlag, SelectionState } from '@/ui';
import { useCalendar } from '@/use-calendar';
import { type DayPickerContext, dayPickerContext } from '@/use-day-picker';
import { useFocus } from '@/use-focus';
import { useGetModifiers } from '@/use-get-modifiers';
import { useSelection } from '@/use-selection';
import { isDateRange } from '@/utils';
import { rangeIncludesDate } from '@/utils/range-includes-date';

/**
 * Render the date picker calendar.
 *
 */
export function DayPicker(props: DayPickerProps): JSX.Element {
  const { components, formatters, labels, dateLib, locale, classNames } = useMemo(() => {
    const locale = { ...defaultLocale, ...props.locale };

    const dateLib = new DateLib(
      {
        locale,
        weekStartsOn: props.weekStartsOn,
        firstWeekContainsDate: props.firstWeekContainsDate,
        useAdditionalWeekYearTokens: props.useAdditionalWeekYearTokens,
        useAdditionalDayOfYearTokens: props.useAdditionalDayOfYearTokens,
      },
      props.dateLib,
    );

    return {
      dateLib,
      components: getComponents(props.components),
      formatters: getFormatters(props.formatters),
      labels: { ...defaultLabels, ...props.labels },
      locale,
      classNames: { ...getDefaultClassNames(), ...props.classNames },
    };
  }, [
    props.classNames,
    props.components,
    props.dateLib,
    props.firstWeekContainsDate,
    props.formatters,
    props.labels,
    props.locale,
    props.useAdditionalDayOfYearTokens,
    props.useAdditionalWeekYearTokens,
    props.weekStartsOn,
  ]);

  const {
    captionLayout,
    mode,
    onDayBlur,
    onDayClick,
    onDayFocus,
    onDayKeyDown,
    onDayMouseEnter,
    onDayMouseLeave,
    onNextClick,
    onPrevClick,
    showWeekNumber,
    styles,
  } = props;

  const {
    formatCaption,
    formatDay,
    formatMonthDropdown,
    formatWeekNumber,
    formatWeekNumberHeader,
    formatWeekdayName,
    formatYearDropdown,
  } = formatters;

  const calendar = useCalendar(props, dateLib);

  const { days, months, navStart, navEnd, previousMonth, nextMonth, goToMonth } = calendar;

  const getModifiers = useGetModifiers(days, props, dateLib);

  const { isSelected, select, selected: selectedValue } = useSelection(props, dateLib) ?? {};

  const { blur, focused, isFocusTarget, moveFocus, setFocused } = useFocus(
    props,
    calendar,
    getModifiers,
    isSelected ?? (() => false),
    dateLib,
  );

  const {
    labelDayButton,
    labelGridCell,
    labelGrid,
    labelMonthDropdown,
    labelNav,
    labelWeekday,
    labelWeekNumber,
    labelWeekNumberHeader,
    labelYearDropdown,
  } = labels;

  const weekdays = useMemo(
    () => getWeekdays(dateLib, props.ISOWeek, props.timeZone),
    [dateLib, props.ISOWeek, props.timeZone],
  );

  const isInteractive = mode !== undefined || onDayClick !== undefined;

  const handlePreviousClick = useCallback(() => {
    if (!previousMonth) {
      return;
    }

    goToMonth(previousMonth);
    onPrevClick?.(previousMonth);
  }, [previousMonth, goToMonth, onPrevClick]);

  const handleNextClick = useCallback(() => {
    if (!nextMonth) {
      return;
    }

    goToMonth(nextMonth);
    onNextClick?.(nextMonth);
  }, [goToMonth, nextMonth, onNextClick]);

  const handleDayClick = useCallback(
    (day: CalendarDay, m: Modifiers) => (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setFocused(day);
      select?.(day.date, m, e);
      onDayClick?.(day.date, m, e);
    },
    [select, onDayClick, setFocused],
  );

  const handleDayFocus = useCallback(
    (day: CalendarDay, m: Modifiers) => (e: FocusEvent) => {
      setFocused(day);
      onDayFocus?.(day.date, m, e);
    },
    [onDayFocus, setFocused],
  );

  const handleDayBlur = useCallback(
    (day: CalendarDay, m: Modifiers) => (e: FocusEvent) => {
      blur();
      onDayBlur?.(day.date, m, e);
    },
    [blur, onDayBlur],
  );

  const handleDayKeyDown = useCallback(
    (day: CalendarDay, modifiers: Modifiers) => (e: KeyboardEvent) => {
      const keyMap: Record<string, [MoveFocusBy, MoveFocusDir]> = {
        ArrowLeft: ['day', props.dir === 'rtl' ? 'after' : 'before'],
        ArrowRight: ['day', props.dir === 'rtl' ? 'before' : 'after'],
        ArrowDown: ['week', 'after'],
        ArrowUp: ['week', 'before'],
        PageUp: [e.shiftKey ? 'year' : 'month', 'before'],
        PageDown: [e.shiftKey ? 'year' : 'month', 'after'],
        Home: ['startOfWeek', 'before'],
        End: ['endOfWeek', 'after'],
      };

      if (keyMap[e.key]) {
        e.preventDefault();
        e.stopPropagation();
        const [moveBy, moveDir] = keyMap[e.key];

        moveFocus(moveBy, moveDir);
      }

      onDayKeyDown?.(day.date, modifiers, e);
    },
    [moveFocus, onDayKeyDown, props.dir],
  );

  const handleDayMouseEnter = useCallback(
    (day: CalendarDay, modifiers: Modifiers) => (e: MouseEvent) => {
      onDayMouseEnter?.(day.date, modifiers, e);
    },
    [onDayMouseEnter],
  );

  const handleDayMouseLeave = useCallback(
    (day: CalendarDay, modifiers: Modifiers) => (e: MouseEvent) => {
      onDayMouseLeave?.(day.date, modifiers, e);
    },
    [onDayMouseLeave],
  );

  const { className, style } = useMemo(
    () => ({
      className: [classNames[UI.Root], props.className].filter(Boolean).join(' '),
      style: { ...styles?.[UI.Root], ...props.style },
    }),
    [classNames, props.className, props.style, styles],
  );

  const dataAttributes = getDataAttributes(props);

  const contextValue: DayPickerContext<DayPickerProps> = {
    dayPickerProps: props,
    selected: selectedValue as SelectedValue<DayPickerProps>,
    select: select as SelectHandler<DayPickerProps>,
    isSelected,
    months,
    nextMonth,
    previousMonth,
    goToMonth,
    getModifiers,
    components,
    classNames,
    styles,
    labels,
    formatters,
  };

  return (
    <dayPickerContext.Provider value={contextValue}>
      <components.Root
        className={className}
        dir={props.dir}
        id={props.id}
        lang={props.lang}
        nonce={props.nonce}
        style={style}
        title={props.title}
        {...dataAttributes}
      >
        <components.Months className={classNames[UI.Months]} style={styles?.[UI.Months]}>
          {!props.hideNavigation && (
            <components.Nav
              aria-label={labelNav()}
              className={classNames[UI.Nav]}
              nextMonth={nextMonth}
              previousMonth={previousMonth}
              style={styles?.[UI.Nav]}
              onNextClick={handleNextClick}
              onPreviousClick={handlePreviousClick}
            />
          )}
          {months.map((calendarMonth, displayIndex) => {
            const handleMonthChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
              const selectedMonth = Number((e.target as HTMLSelectElement).value);
              const month = dateLib.setMonth(dateLib.startOfMonth(calendarMonth.date), selectedMonth);

              goToMonth(month);
            };

            const handleYearChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
              const month = dateLib.setYear(dateLib.startOfMonth(calendarMonth.date), Number(e.target.value));

              goToMonth(month);
            };

            const dropdownMonths = getMonthOptions(calendarMonth.date, navStart, navEnd, formatters, dateLib);

            const dropdownYears = getYearOptions(months[0].date, navStart, navEnd, formatters, dateLib);

            return (
              <components.Month
                key={displayIndex}
                calendarMonth={calendarMonth}
                className={classNames[UI.Month]}
                displayIndex={displayIndex}
                style={styles?.[UI.Month]}
              >
                <components.MonthCaption
                  calendarMonth={calendarMonth}
                  className={classNames[UI.MonthCaption]}
                  displayIndex={displayIndex}
                  style={styles?.[UI.MonthCaption]}
                >
                  {captionLayout?.startsWith('dropdown') ? (
                    <components.DropdownNav className={classNames[UI.Dropdowns]} style={styles?.[UI.Dropdowns]}>
                      {captionLayout === 'dropdown' || captionLayout === 'dropdown-months' ? (
                        <components.MonthsDropdown
                          aria-label={labelMonthDropdown()}
                          className={classNames[UI.MonthsDropdown]}
                          classNames={classNames}
                          components={components}
                          disabled={Boolean(props.disableNavigation)}
                          options={dropdownMonths}
                          style={styles?.[UI.Dropdown]}
                          value={calendarMonth.date.getMonth()}
                          onChange={handleMonthChange}
                        />
                      ) : (
                        <span aria-live="polite" role="status">
                          {formatMonthDropdown(calendarMonth.date.getMonth(), locale)}
                        </span>
                      )}
                      {captionLayout === 'dropdown' || captionLayout === 'dropdown-years' ? (
                        <components.YearsDropdown
                          aria-label={labelYearDropdown(dateLib.options)}
                          className={classNames[UI.YearsDropdown]}
                          classNames={classNames}
                          components={components}
                          disabled={Boolean(props.disableNavigation)}
                          options={dropdownYears}
                          style={styles?.[UI.Dropdown]}
                          value={calendarMonth.date.getFullYear()}
                          onChange={handleYearChange}
                        />
                      ) : (
                        <span aria-live="polite" role="status">
                          {formatYearDropdown(calendarMonth.date.getFullYear())}
                        </span>
                      )}
                    </components.DropdownNav>
                  ) : (
                    <components.CaptionLabel aria-live="polite" className={classNames[UI.CaptionLabel]} role="status">
                      {formatCaption(calendarMonth.date, dateLib.options, dateLib)}
                    </components.CaptionLabel>
                  )}
                </components.MonthCaption>
                <components.MonthGrid
                  aria-label={labelGrid(calendarMonth.date, dateLib.options, dateLib) || undefined}
                  aria-multiselectable={mode === 'multiple' || mode === 'range'}
                  className={classNames[UI.MonthGrid]}
                  role="grid"
                  style={styles?.[UI.MonthGrid]}
                >
                  {!props.hideWeekdays && (
                    <components.Weekdays className={classNames[UI.Weekdays]} style={styles?.[UI.Weekdays]}>
                      {showWeekNumber ? (
                        <components.WeekNumberHeader
                          aria-label={labelWeekNumberHeader(dateLib.options)}
                          className={classNames[UI.WeekNumberHeader]}
                          scope="col"
                          style={styles?.[UI.WeekNumberHeader]}
                        >
                          {formatWeekNumberHeader()}
                        </components.WeekNumberHeader>
                      ) : null}
                      {weekdays.map((weekday, i) => (
                        <components.Weekday
                          key={i}
                          aria-label={labelWeekday(weekday, dateLib.options, dateLib)}
                          className={classNames[UI.Weekday]}
                          scope="col"
                          style={styles?.[UI.Weekday]}
                        >
                          {formatWeekdayName(weekday, dateLib.options, dateLib)}
                        </components.Weekday>
                      ))}
                    </components.Weekdays>
                  )}
                  <components.Weeks className={classNames[UI.Weeks]} style={styles?.[UI.Weeks]}>
                    {calendarMonth.weeks.map((week, weekIndex) => {
                      return (
                        <components.Week
                          key={week.weekNumber}
                          className={classNames[UI.Week]}
                          style={styles?.[UI.Week]}
                          week={week}
                        >
                          {showWeekNumber ? (
                            <components.WeekNumber
                              aria-label={labelWeekNumber(week.weekNumber, {
                                locale,
                              })}
                              className={classNames[UI.WeekNumber]}
                              scope="row"
                              style={styles?.[UI.WeekNumber]}
                              week={week}
                            >
                              {formatWeekNumber(week.weekNumber)}
                            </components.WeekNumber>
                          ) : null}
                          {week.days.map((day: CalendarDay) => {
                            const { date } = day;
                            const modifiers = getModifiers(day);

                            modifiers[DayFlag.focused] = !modifiers.hidden && Boolean(focused?.isEqualTo(day));

                            modifiers[SelectionState.selected] =
                              !modifiers.disabled && (isSelected?.(date) || modifiers.selected);

                            if (isDateRange(selectedValue)) {
                              // add range modifiers
                              const { from, to } = selectedValue;

                              modifiers[SelectionState.range_start] = Boolean(
                                from && to && dateLib.isSameDay(date, from),
                              );
                              modifiers[SelectionState.range_end] = Boolean(from && to && dateLib.isSameDay(date, to));
                              modifiers[SelectionState.range_middle] = rangeIncludesDate(
                                selectedValue,
                                date,
                                true,
                                dateLib,
                              );
                            }

                            const style = getStyleForModifiers(modifiers, styles, props.modifiersStyles);

                            const className = getClassNamesForModifiers(
                              modifiers,
                              classNames,
                              props.modifiersClassNames,
                            );

                            const ariaLabel = !isInteractive
                              ? labelGridCell(date, modifiers, dateLib.options, dateLib)
                              : undefined;

                            return (
                              <components.Day
                                key={`${dateLib.format(date, 'yyyy-MM-dd')}_${dateLib.format(day.displayMonth, 'yyyy-MM')}`}
                                aria-hidden={modifiers.hidden || undefined}
                                aria-label={ariaLabel}
                                aria-selected={modifiers.selected || undefined}
                                className={className.join(' ')}
                                data-day={dateLib.format(date, 'yyyy-MM-dd')}
                                data-disabled={modifiers.disabled || undefined}
                                data-focused={modifiers.focused || undefined}
                                data-hidden={modifiers.hidden || undefined}
                                data-month={day.outside ? dateLib.format(date, 'yyyy-MM') : undefined}
                                data-outside={day.outside || undefined}
                                data-selected={modifiers.selected || undefined}
                                data-today={modifiers.today || undefined}
                                day={day}
                                modifiers={modifiers}
                                style={style}
                              >
                                {isInteractive ? (
                                  <components.DayButton
                                    aria-label={labelDayButton(date, modifiers, dateLib.options, dateLib)}
                                    className={classNames[UI.DayButton]}
                                    day={day}
                                    disabled={modifiers.disabled || undefined}
                                    modifiers={modifiers}
                                    style={styles?.[UI.DayButton]}
                                    tabIndex={isFocusTarget(day) ? 0 : -1}
                                    type="button"
                                    onBlur={handleDayBlur(day, modifiers)}
                                    onClick={handleDayClick(day, modifiers)}
                                    onFocus={handleDayFocus(day, modifiers)}
                                    onKeyDown={handleDayKeyDown(day, modifiers)}
                                    onMouseEnter={handleDayMouseEnter(day, modifiers)}
                                    onMouseLeave={handleDayMouseLeave(day, modifiers)}
                                  >
                                    {formatDay(date, dateLib.options, dateLib)}
                                  </components.DayButton>
                                ) : (
                                  formatDay(day.date, dateLib.options, dateLib)
                                )}
                              </components.Day>
                            );
                          })}
                        </components.Week>
                      );
                    })}
                  </components.Weeks>
                </components.MonthGrid>
              </components.Month>
            );
          })}
        </components.Months>
        {props.footer ? (
          <components.Footer
            aria-live="polite"
            className={classNames[UI.Footer]}
            role="status"
            style={styles?.[UI.Footer]}
          >
            {props.footer}
          </components.Footer>
        ) : null}
      </components.Root>
    </dayPickerContext.Provider>
  );
}