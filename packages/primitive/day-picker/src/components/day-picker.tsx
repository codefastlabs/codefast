import type { ChangeEvent, FocusEvent, JSX, KeyboardEvent, MouseEvent } from 'react';

import { useCallback, useMemo } from 'react';

import type { CalendarDay } from '@/lib/classes/calendar-day';
import type { DayPickerContext } from '@/lib/hooks/use-day-picker';
import type {
  DayPickerProps,
  Modifiers,
  MoveFocusBy,
  MoveFocusDir,
  SelectedValue,
  SelectHandler,
} from '@/lib/types';

import { DateLib } from '@/lib/classes/date-lib';
import { DayFlag, SelectionState, UI } from '@/lib/constants/ui';
import { getClassNames } from '@/lib/helpers/get-class-names';
import { getClassNamesForModifiers } from '@/lib/helpers/get-class-names-for-modifiers';
import { getComponents } from '@/lib/helpers/get-components';
import { getDataAttributes } from '@/lib/helpers/get-data-attributes';
import { getFormatters } from '@/lib/helpers/get-formatters';
import { getLabels } from '@/lib/helpers/get-labels';
import { getLocale } from '@/lib/helpers/get-locale';
import { getMonthOptions } from '@/lib/helpers/get-month-options';
import { getStyleForModifiers } from '@/lib/helpers/get-style-for-modifiers';
import { getWeekdays } from '@/lib/helpers/get-weekdays';
import { getYearOptions } from '@/lib/helpers/get-year-options';
import { useCalendar } from '@/lib/hooks/use-calendar';
import { dayPickerContext } from '@/lib/hooks/use-day-picker';
import { useFocus } from '@/lib/hooks/use-focus';
import { useGetModifiers } from '@/lib/hooks/use-get-modifiers';
import { useSelection } from '@/lib/hooks/use-selection';
import { isDateRange } from '@/lib/utils';
import { rangeIncludesDate } from '@/lib/utils/range-includes-date';

/**
 * Render the date picker calendar.
 */
export function DayPicker(props: DayPickerProps): JSX.Element {
  const { classNames, components, dateLib, formatters, labels, locale } = useMemo(() => {
    const mergedLocale = getLocale(props.locale);

    const mergedDateLib = new DateLib(
      {
        firstWeekContainsDate: props.firstWeekContainsDate,
        locale: mergedLocale,
        useAdditionalDayOfYearTokens: props.useAdditionalDayOfYearTokens,
        useAdditionalWeekYearTokens: props.useAdditionalWeekYearTokens,
        weekStartsOn: props.broadcastCalendar ? 1 : props.weekStartsOn,
      },
      props.dateLib,
    );

    return {
      classNames: getClassNames(props.classNames),
      components: getComponents(props.components),
      dateLib: mergedDateLib,
      formatters: getFormatters(props.formatters),
      labels: getLabels(props.labels),
      locale: mergedLocale,
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
    props.broadcastCalendar,
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
    formatWeekdayName,
    formatWeekNumber,
    formatWeekNumberHeader,
    formatYearDropdown,
  } = formatters;

  const calendar = useCalendar(props, dateLib);

  const { days, goToMonth, months, navEnd, navStart, nextMonth, previousMonth } = calendar;

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
    labelGrid,
    labelGridcell,
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
    (day: CalendarDay, m: Modifiers) => (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setFocused(day);
      select?.(day.date, m, event);
      onDayClick?.(day.date, m, event);
    },
    [select, onDayClick, setFocused],
  );

  const handleDayFocus = useCallback(
    (day: CalendarDay, m: Modifiers) => (event: FocusEvent) => {
      setFocused(day);
      onDayFocus?.(day.date, m, event);
    },
    [onDayFocus, setFocused],
  );

  const handleDayBlur = useCallback(
    (day: CalendarDay, m: Modifiers) => (event: FocusEvent) => {
      blur();
      onDayBlur?.(day.date, m, event);
    },
    [blur, onDayBlur],
  );

  const handleDayKeyDown = useCallback(
    (day: CalendarDay, modifiers: Modifiers) => (event: KeyboardEvent) => {
      const keyMap: Record<string, [MoveFocusBy, MoveFocusDir]> = {
        ArrowDown: ['week', 'after'],
        ArrowLeft: ['day', props.dir === 'rtl' ? 'after' : 'before'],
        ArrowRight: ['day', props.dir === 'rtl' ? 'before' : 'after'],
        ArrowUp: ['week', 'before'],
        End: ['endOfWeek', 'after'],
        Home: ['startOfWeek', 'before'],
        PageDown: [event.shiftKey ? 'year' : 'month', 'after'],
        PageUp: [event.shiftKey ? 'year' : 'month', 'before'],
      };

      if (event.key in keyMap) {
        event.preventDefault();
        event.stopPropagation();
        const [moveBy, moveDir] = keyMap[event.key];

        moveFocus(moveBy, moveDir);
      }

      onDayKeyDown?.(day.date, modifiers, event);
    },
    [moveFocus, onDayKeyDown, props.dir],
  );

  const handleDayMouseEnter = useCallback(
    (day: CalendarDay, modifiers: Modifiers) => (event: MouseEvent) => {
      onDayMouseEnter?.(day.date, modifiers, event);
    },
    [onDayMouseEnter],
  );

  const handleDayMouseLeave = useCallback(
    (day: CalendarDay, modifiers: Modifiers) => (event: MouseEvent) => {
      onDayMouseLeave?.(day.date, modifiers, event);
    },
    [onDayMouseLeave],
  );

  const handleMonthChange = useCallback(
    (date: Date) => (e: ChangeEvent<HTMLSelectElement>) => {
      const selectedMonth = Number(e.target.value);
      const month = dateLib.setMonth(dateLib.startOfMonth(date), selectedMonth);

      goToMonth(month);
    },
    [dateLib, goToMonth],
  );

  const handleYearChange = useCallback(
    (date: Date) => (e: ChangeEvent<HTMLSelectElement>) => {
      const selectedYear = Number(e.target.value);
      const month = dateLib.setYear(dateLib.startOfMonth(date), selectedYear);

      goToMonth(month);
    },
    [dateLib, goToMonth],
  );

  const { className, style } = useMemo(
    () => ({
      className: [classNames[UI.Root], props.className].filter(Boolean).join(' '),
      style: {
        ...styles?.[UI.Root],
        ...props.style,
      },
    }),
    [classNames, props.className, props.style, styles],
  );

  const dataAttributes = getDataAttributes(props);

  const contextValue: DayPickerContext<DayPickerProps> = {
    classNames,
    components,
    dayPickerProps: props,
    formatters,
    getModifiers,
    goToMonth,
    isSelected,
    labels,
    months,
    nextMonth,
    previousMonth,
    select: select as SelectHandler<DayPickerProps>,
    selected: selectedValue as SelectedValue<DayPickerProps>,
    styles,
  };

  return (
    <dayPickerContext.Provider value={contextValue}>
      <components.Root
        aria-label={props['aria-label']}
        className={className}
        dir={props.dir}
        id={props.id}
        lang={props.lang}
        nonce={props.nonce}
        role={props.role}
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
            const dropdownMonths = getMonthOptions(
              calendarMonth.date,
              navStart,
              navEnd,
              formatters,
              dateLib,
            );

            const dropdownYears = getYearOptions(
              months[0].date,
              navStart,
              navEnd,
              formatters,
              dateLib,
            );

            return (
              <components.Month
                // eslint-disable-next-line react/no-array-index-key -- we need the index
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
                    <components.DropdownNav
                      className={classNames[UI.Dropdowns]}
                      style={styles?.[UI.Dropdowns]}
                    >
                      {captionLayout === 'dropdown' || captionLayout === 'dropdown-months' ? (
                        <components.MonthsDropdown
                          aria-label={labelMonthDropdown()}
                          className={classNames[UI.MonthsDropdown]}
                          disabled={Boolean(props.disableNavigation)}
                          options={dropdownMonths}
                          style={styles?.[UI.Dropdown]}
                          value={calendarMonth.date.getMonth()}
                          onChange={handleMonthChange(calendarMonth.date)}
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
                          disabled={Boolean(props.disableNavigation)}
                          options={dropdownYears}
                          style={styles?.[UI.Dropdown]}
                          value={calendarMonth.date.getFullYear()}
                          onChange={handleYearChange(calendarMonth.date)}
                        />
                      ) : (
                        <span aria-live="polite" role="status">
                          {formatYearDropdown(calendarMonth.date.getFullYear())}
                        </span>
                      )}
                    </components.DropdownNav>
                  ) : (
                    <components.CaptionLabel
                      aria-live="polite"
                      className={classNames[UI.CaptionLabel]}
                      role="status"
                    >
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
                    <components.Weekdays
                      className={classNames[UI.Weekdays]}
                      style={styles?.[UI.Weekdays]}
                    >
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
                      {weekdays.map((weekday, weekdayIndex) => (
                        <components.Weekday
                          // eslint-disable-next-line react/no-array-index-key -- we need the index
                          key={weekdayIndex}
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
                    {calendarMonth.weeks.map((week, _weekIndex) => {
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
                              role="rowheader"
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

                            modifiers[DayFlag.focused] =
                              !modifiers.hidden && Boolean(focused?.isEqualTo(day));

                            modifiers[SelectionState.selected] =
                              !modifiers.disabled && (isSelected?.(date) || modifiers.selected);

                            if (isDateRange(selectedValue)) {
                              // add range modifiers
                              const { from, to } = selectedValue;

                              modifiers[SelectionState.range_start] = Boolean(
                                from && to && dateLib.isSameDay(date, from),
                              );
                              modifiers[SelectionState.range_end] = Boolean(
                                from && to && dateLib.isSameDay(date, to),
                              );
                              modifiers[SelectionState.range_middle] = rangeIncludesDate(
                                selectedValue,
                                date,
                                true,
                                dateLib,
                              );
                            }

                            const styleForModifiers = getStyleForModifiers(
                              modifiers,
                              styles,
                              props.modifiersStyles,
                            );

                            const classNamesForModifiers = getClassNamesForModifiers(
                              modifiers,
                              classNames,
                              props.modifiersClassNames,
                            );

                            const ariaLabel =
                              !isInteractive && !modifiers.hidden
                                ? labelGridcell(date, modifiers, dateLib.options, dateLib)
                                : undefined;

                            return (
                              <components.Day
                                key={`${dateLib.format(date, 'yyyy-MM-dd')}_${dateLib.format(day.displayMonth, 'yyyy-MM')}`}
                                aria-hidden={modifiers.hidden || undefined}
                                aria-label={ariaLabel}
                                aria-selected={modifiers.selected || undefined}
                                className={classNamesForModifiers.join(' ')}
                                data-day={dateLib.format(date, 'yyyy-MM-dd')}
                                data-disabled={modifiers.disabled || undefined}
                                data-focused={modifiers.focused || undefined}
                                data-hidden={modifiers.hidden || undefined}
                                data-month={
                                  day.outside ? dateLib.format(date, 'yyyy-MM') : undefined
                                }
                                data-outside={day.outside || undefined}
                                data-selected={modifiers.selected || undefined}
                                data-today={modifiers.today || undefined}
                                day={day}
                                modifiers={modifiers}
                                role="gridcell"
                                style={styleForModifiers}
                              >
                                {!modifiers.hidden && isInteractive ? (
                                  <components.DayButton
                                    aria-label={labelDayButton(
                                      date,
                                      modifiers,
                                      dateLib.options,
                                      dateLib,
                                    )}
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
                                  !modifiers.hidden && formatDay(day.date, dateLib.options, dateLib)
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
