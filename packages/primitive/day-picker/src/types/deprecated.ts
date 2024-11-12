import { type FocusEvent, type KeyboardEvent } from 'react';

import { MonthCaption, type MonthCaptionProps } from '@/components/month-caption';
import { Week, type WeekProps } from '@/components/week';
import { useDayPicker } from '@/hooks/use-day-picker';
import { type labelDayButton, type labelNext, type labelWeekday, type labelWeekNumber } from '@/labels';
import { type PropsMulti, type PropsRange, type PropsSingle } from '@/types/props';
import { type DayEventHandler, type Mode } from '@/types/shared';

/**
 * @deprecated This type will be removed.
 */
export type RootProvider = never;

/**
 * @deprecated This type will be removed.
 */
export type RootProviderProps = never;

/**
 * @deprecated This component has been renamed. Use `MonthCaption` instead.
 */
export const Caption = MonthCaption;

/**
 * @deprecated This type has been renamed. Use `MonthCaptionProps` instead.
 */
export type CaptionProps = MonthCaptionProps;

/**
 * @deprecated This component has been removed.
 */
export type HeadRow = never;

/**
 * @deprecated This component has been renamed. Use `Week` instead.
 */
export const Row = Week;

/**
 * @deprecated This type has been removed. Use `WeekProps` instead.
 */
export type RowProps = WeekProps;

/**
 * @deprecated This type has been renamed. Use `PropsSingle` instead.
 */
export type DayPickerSingleProps = PropsSingle;

/**
 * @deprecated This type has been renamed. Use `PropsMulti` instead.
 */
export type DayPickerMultipleProps = PropsMulti;

/**
 * @deprecated This type has been renamed. Use `PropsRange` instead.
 */
export type DayPickerRangeProps = PropsRange;

/**
 * @deprecated This type will be removed. Use `NonNullable<unknown>` instead
 */
export type DayPickerDefaultProps = NonNullable<unknown>;

/**
 * @deprecated This type has been renamed. Use `Mode` instead.
 */
export type DaySelectionMode = Mode;

/**
 * @deprecated This type will be removed. Use `string` instead;
 */
export type Modifier = string;

/**
 * @deprecated This type will be removed. Use `SelectHandler<"single">` instead.
 */
export type SelectSingleEventHandler = PropsSingle['onSelect'];

/**
 * @deprecated This type will be removed. Use `SelectHandler<"multiple">`
 *   instead.
 */
export type SelectMultipleEventHandler = PropsMulti['onSelect'];

/**
 * @deprecated This type will be removed. Use `SelectHandler<"range">` instead.
 */
export type SelectRangeEventHandler = PropsRange['onSelect'];

/**
 * @deprecated This type is not used anymore.
 */
export type DayPickerProviderProps = never;

/**
 * @deprecated This type has been removed to `useDayPicker`.
 */
export const useNavigation = useDayPicker;

/**
 * @deprecated This hook has been removed. Use a custom `Day` component instead.
 */
export type UseDayRender = never;

/**
 * @deprecated This type is not used anymore.
 */
export type ContextProvidersProps = never;

/**
 * @deprecated Use `typeof labelDayButton` instead.
 */
export type DayLabel = typeof labelDayButton;

/**
 * @deprecated Use `typeof labelNext` or `typeof labelPrevious` instead.
 */
export type NavButtonLabel = typeof labelNext;

/**
 * @deprecated Use `typeof labelWeekday` instead.
 */
export type WeekdayLabel = typeof labelWeekday;

/**
 * @deprecated Use `typeof labelWeekNumber` instead.
 */
export type WeekNumberLabel = typeof labelWeekNumber;

/**
 * @deprecated Use {@link DayMouseEventHandler} instead.
 */
export type DayClickEventHandler = DayEventHandler<MouseEvent>;

/**
 * @deprecated This type will be removed. Use `DayEventHandler<React.FocusEvent | React.KeyboardEvent>` instead.
 */
export type DayFocusEventHandler = DayEventHandler<FocusEvent | KeyboardEvent>;

/**
 * @deprecated This type will be removed. Use `DayEventHandler<React.KeyboardEvent>` instead.
 */
export type DayKeyboardEventHandler = DayEventHandler<KeyboardEvent>;

/**
 * @deprecated This type will be removed. Use `DayEventHandler<React.MouseEvent>` instead.
 */
export type DayMouseEventHandler = DayEventHandler<MouseEvent>;

/**
 * @deprecated This type will be removed. Use `DayEventHandler<React.PointerEvent>` instead.
 */
export type DayPointerEventHandler = DayEventHandler<PointerEvent>;

/**
 * @deprecated This type will be removed. Use `DayEventHandler<React.TouchEvent>` instead.
 */
export type DayTouchEventHandler = DayEventHandler<TouchEvent>;
