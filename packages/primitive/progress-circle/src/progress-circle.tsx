'use client';

import type { Scope } from '@radix-ui/react-context';
import type { ComponentProps, PropsWithChildren, ReactNode } from 'react';

import { createContextScope } from '@radix-ui/react-context';
import { useId, useMemo } from 'react';

/* -----------------------------------------------------------------------------
 * Context: ProgressCircleProvider
 * ---------------------------------------------------------------------------*/

const PROGRESS_CIRCLE_PROVIDER_NAME = 'ProgressCircleProvider';

type ScopedProps<P> = P & { __scopeProgressCircle?: Scope };

/**
 * Threshold - Defines color thresholds based on progress values
 */
interface Threshold {
  /**
   * Background color to be applied
   */
  background: string;

  /**
   * Foreground color to be applied
   */
  color: string;

  /**
   * The value at which this threshold becomes active
   */
  value: number;
}

/**
 * Props for the ProgressCircleProvider component
 */
interface ProgressCircleContextValue {
  /**
   * Center coordinate of the circle
   * Calculated as half of the size
   */
  center: number;

  /**
   * Total circumference of the circle
   * Used for calculating stroke dash array and offset
   */
  circumference: number;

  /**
   * Unique identifier for the progress circle
   * Used for SVG clip paths and other DOM-related identifiers
   */
  id: string;

  /**
   * Maximum possible value for the progress
   * Used to calculate the normalized value
   */
  max: number;

  /**
   * Minimum possible value for the progress
   * Used to calculate the normalized value
   */
  min: number;

  /**
   * Value normalized between 0 and 1
   * Calculated based on the current value and min/max values
   */
  normalizedValue: number;

  /**
   * Radius of the circle
   * Used for SVG circle calculations
   */
  radius: number;

  /**
   * CSS transform value for rotation
   * Used to position the progress indicator at the correct angle
   */
  rotationTransform: string;

  /**
   * The size of the progress circle in pixels
   * Determines the width and height of the SVG
   */
  size: number;

  /**
   * Stroke dash offset value
   * Used to determine how much of the circle should be filled
   */
  strokeDashoffset: number;

  /**
   * Width of the stroke for the progress indicator
   * Determines the thickness of the circle
   */
  strokeWidth: number;

  /**
   * Threshold configuration for the progress circle
   * Used for color changes at specific value points
   */
  threshold: Threshold | undefined;

  /**
   * Current value of the progress circle
   * Raw value before normalization
   */
  value: number;

  /**
   * Text representation of the current value
   * Used for accessibility and display purposes
   */
  valueText: string;
}

const [createProgressCircleContext, createProgressCircleScope] = createContextScope(PROGRESS_CIRCLE_PROVIDER_NAME);

const [ProgressCircleContextProvider, useProgressCircleContext] =
  createProgressCircleContext<ProgressCircleContextValue>(PROGRESS_CIRCLE_PROVIDER_NAME);

/* -----------------------------------------------------------------------------
 * Component: ProgressCircleProvider
 * ---------------------------------------------------------------------------*/

/**
 * ProgressCircleProvider - Context provider for the Progress Circle component
 *
 * Manages and calculates all the values needed for rendering a circular progress indicator.
 * Handles value normalization, sizing calculations, and threshold management.
 *
 * @example
 * ```tsx
 * <ProgressCircleProvider
 *   value={75}
 *   min={0}
 *   max={100}
 *   size={64}
 *   thresholds={[
 *     { value: 30, color: 'red', background: 'pink' },
 *     { value: 70, color: 'yellow', background: 'lightyellow' },
 *     { value: 100, color: 'green', background: 'lightgreen' }
 *   ]}
 * >
 *   <ProgressCircleSVG>
 *     <ProgressCircleIndicator />
 *     <ProgressCircleTrack />
 *   </ProgressCircleSVG>
 *   <ProgressCircleLabel />
 * </ProgressCircleProvider>
 * ```
 */
function ProgressCircleProvider({
  __scopeProgressCircle,
  value = 0,
  min = 0,
  max = 100,
  thresholds,
  strokeWidth = 4,
  size = 48,
  valueFormatter,
  id: propId,
  startAngle = -90,
  children,
}: ScopedProps<
  PropsWithChildren<{
    id?: string;
    max?: number;
    min?: number;
    size?: number;
    startAngle?: number;
    strokeWidth?: number;
    thresholds?: Threshold[];
    value?: number;
    valueFormatter?: (value: number) => string;
  }>
>): ReactNode {
  const uniqueId = useId();
  const id = propId || uniqueId;

  const validSize = Math.max(0, size);
  const validStrokeWidth = Math.max(0, strokeWidth);
  const validStartAngle = startAngle % 360;

  let validMin = min;
  let validMax = max;

  if (validMin > validMax) {
    [validMin, validMax] = [validMax, validMin];
  }

  const normalizedValue = clamp(validMin, validMax, value);
  const range = validMax - validMin;
  const percentage = range > 0 ? Math.round(((normalizedValue - validMin) / range) * 100 * 1000) / 1000 : 0;

  const sortedThresholds = useMemo(
    () => (thresholds && thresholds.length > 0 ? [...thresholds].sort((a, b) => a.value - b.value) : []),
    [thresholds],
  );

  const threshold = useMemo(() => {
    for (const sortedThreshold of sortedThresholds) {
      if (normalizedValue <= sortedThreshold.value) {
        return sortedThreshold;
      }
    }

    return sortedThresholds.at(-1);
  }, [sortedThresholds, normalizedValue]);

  const center = validSize / 2;
  const radius = Math.max(0, center - validStrokeWidth / 2);
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const rotationTransform = `rotate(${validStartAngle}, 0, 0)`;

  const valueText = (valueFormatter || ((val: number) => `${Math.round(val)}%`))(percentage);

  return (
    <ProgressCircleContextProvider
      center={center}
      circumference={circumference}
      id={id}
      max={validMax}
      min={validMin}
      normalizedValue={normalizedValue}
      radius={radius}
      rotationTransform={rotationTransform}
      scope={__scopeProgressCircle}
      size={validSize}
      strokeDashoffset={strokeDashoffset}
      strokeWidth={validStrokeWidth}
      threshold={threshold}
      value={value}
      valueText={valueText}
    >
      {children}
    </ProgressCircleContextProvider>
  );
}

/* -------------------------------------------------------------------------------------------------
 * Component: ProgressCircle
 * -----------------------------------------------------------------------------------------------*/

function ProgressCircle({ __scopeProgressCircle, ...props }: ScopedProps<ComponentProps<'div'>>): ReactNode {
  return <div {...props} />;
}

/* -------------------------------------------------------------------------------------------------
 * Component: ProgressCircleSVG
 * -----------------------------------------------------------------------------------------------*/

const PROGRESS_CIRCLE_SVG_NAME = 'ProgressCircleSVG';

function ProgressCircleSVG({ __scopeProgressCircle, ...props }: ScopedProps<ComponentProps<'svg'>>): ReactNode {
  const { size, id, valueText, max, min, normalizedValue, value } = useProgressCircleContext(
    PROGRESS_CIRCLE_SVG_NAME,
    __scopeProgressCircle,
  );

  return (
    <svg
      aria-valuemax={max}
      aria-valuemin={min}
      aria-valuenow={normalizedValue || value ? 0 : undefined}
      aria-valuetext={valueText}
      height={size}
      id={id}
      role="progressbar"
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------------------------------
 * Component: ProgressCircleTrack
 * -----------------------------------------------------------------------------------------------*/

const PROGRESS_CIRCLE_TRACK_NAME = 'ProgressCircleTrack';

function ProgressCircleTrack({ __scopeProgressCircle, ...props }: ScopedProps<ComponentProps<'circle'>>): ReactNode {
  const { radius, strokeWidth, threshold, center } = useProgressCircleContext(
    PROGRESS_CIRCLE_TRACK_NAME,
    __scopeProgressCircle,
  );

  return (
    <circle
      cx={center}
      cy={center}
      fill="transparent"
      r={radius}
      stroke={threshold?.background || 'currentColor'}
      strokeWidth={strokeWidth}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------------------------------
 * Component: ProgressCircleIndicator
 * -----------------------------------------------------------------------------------------------*/

const PROGRESS_CIRCLE_INDICATOR_NAME = 'ProgressCircleIndicator';

function ProgressCircleIndicator({
  __scopeProgressCircle,
  ...props
}: ScopedProps<ComponentProps<'circle'>>): ReactNode {
  const { radius, circumference, strokeDashoffset, rotationTransform, strokeWidth, threshold, center } =
    useProgressCircleContext(PROGRESS_CIRCLE_INDICATOR_NAME, __scopeProgressCircle);

  return (
    <circle
      cx={center}
      cy={center}
      fill="transparent"
      r={radius}
      stroke={threshold?.color || 'currentColor'}
      strokeDasharray={circumference}
      strokeDashoffset={strokeDashoffset}
      strokeLinecap="round"
      strokeWidth={strokeWidth}
      transform={rotationTransform}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------------------------------
 * Component: ProgressCircleValue
 * -----------------------------------------------------------------------------------------------*/

const PROGRESS_CIRCLE_VALUE_NAME = 'ProgressCircleValue';

function ProgressCircleValue({
  __scopeProgressCircle,
  children,
  ...props
}: Omit<ScopedProps<ComponentProps<'div'>>, 'children'> & {
  children?: ((context: { value: number; valueText: string }) => ReactNode) | ReactNode;
}): ReactNode {
  const { valueText, value } = useProgressCircleContext(PROGRESS_CIRCLE_VALUE_NAME, __scopeProgressCircle);

  if (typeof children === 'function') {
    return children({ valueText, value });
  }

  return <div {...props}>{children || valueText}</div>;
}

/* -----------------------------------------------------------------------------
 * Helpers
 * -------------------------------------------------------------------------- */

/**
 * Restricts a numerical value to be within the inclusive range defined by a minimum and maximum value.
 *
 * This function ensures that the `value` does not fall below the `min` or exceed the `max`.
 * If `value` is less than `min`, it returns `min`.
 * If `value` is greater than `max`, it returns `max`.
 * Otherwise, it returns the `value` itself.
 * The result is rounded to the nearest integer.
 *
 * @param min - The lower boundary of the range.
 * @param max - The upper boundary of the range.
 * @param value - The number to be clamped within the range.
 * @returns The clamped and rounded value within the specified range.
 */
function clamp(min: number, max: number, value: number): number {
  return Math.min(max, Math.max(min, value));
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  createProgressCircleScope,
  ProgressCircleIndicator as Indicator,
  ProgressCircle,
  ProgressCircleIndicator,
  ProgressCircleProvider,
  ProgressCircleSVG,
  ProgressCircleTrack,
  ProgressCircleValue,
  ProgressCircleProvider as Provider,
  ProgressCircle as Root,
  ProgressCircleSVG as SVG,
  ProgressCircleTrack as Track,
  ProgressCircleValue as Value,
};
