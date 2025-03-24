'use client';

import type { Scope } from '@radix-ui/react-context';
import type { ComponentProps, JSX, PropsWithChildren } from 'react';

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
  maxValue: number;

  /**
   * Minimum possible value for the progress
   * Used to calculate the normalized value
   */
  minValue: number;

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
 *   minValue={0}
 *   maxValue={100}
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
  minValue = 0,
  maxValue = 100,
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
    maxValue?: number;
    minValue?: number;
    size?: number;
    startAngle?: number;
    strokeWidth?: number;
    thresholds?: Threshold[];
    value?: number;
    valueFormatter?: (value: number) => string;
  }>
>): JSX.Element {
  const uniqueId = useId();
  const id = propId || uniqueId;

  // Group 1: Values that change infrequently - basic configuration
  const baseConfig = useMemo(() => {
    const validSize = Math.max(0, size);
    const validStrokeWidth = Math.max(0, strokeWidth);
    const validStartAngle = startAngle % 360;

    // Validate min/max
    let validMin = minValue;
    let validMax = maxValue;

    if (validMin > validMax) {
      [validMin, validMax] = [validMax, validMin];
    }

    return {
      validMinValue: validMin,
      validMaxValue: validMax,
      validSize,
      validStartAngle,
      validStrokeWidth,
    };
  }, [size, strokeWidth, startAngle, minValue, maxValue]);

  // Group 2: Handling thresholds - rarely changed
  const sortedThresholds = useMemo(() => {
    return thresholds && thresholds.length > 0 ? [...thresholds].sort((a, b) => a.value - b.value) : [];
  }, [thresholds]);

  // Group 3: Safe formatter - rarely changes
  const safeValueFormatter = useMemo(() => {
    return valueFormatter || ((val: number) => `${Math.round(val)}%`);
  }, [valueFormatter]);

  // Group 4: Calculations dependent on values – frequently changing
  const valueCalculations = useMemo(() => {
    // Standardize value
    const normalizedValue = clamp(baseConfig.validMinValue, baseConfig.validMaxValue, value);
    const range = baseConfig.validMaxValue - baseConfig.validMinValue;
    const percentage =
      range > 0 ? Math.round(((normalizedValue - baseConfig.validMinValue) / range) * 100 * 1000) / 1000 : 0;

    return {
      normalizedValue,
      percentage,
    };
  }, [baseConfig.validMinValue, baseConfig.validMaxValue, value]);

  // Group 5: Threshold processing based on normalized value
  const threshold = useMemo<Threshold | undefined>(() => {
    if (sortedThresholds.length === 0) {
      return;
    }

    // Find the matching color based on the normalized value
    let thresholdColor: Threshold | undefined;

    for (const sortedThreshold of sortedThresholds) {
      if (valueCalculations.normalizedValue <= sortedThreshold.value) {
        thresholdColor = sortedThreshold;
        break;
      }
    }

    // If the value is greater than all thresholds, use the last threshold
    if (!thresholdColor && sortedThresholds.length > 0) {
      thresholdColor = sortedThresholds.at(-1);
    }

    return thresholdColor;
  }, [sortedThresholds, valueCalculations.normalizedValue]);

  // Group 6: Geometric properties of a circle - dependent on size, stroke and percentage
  const circleGeometry = useMemo(() => {
    const center = baseConfig.validSize / 2;
    const radius = Math.max(0, center - baseConfig.validStrokeWidth / 2);
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (valueCalculations.percentage / 100) * circumference;
    const rotationTransform = `rotate(${baseConfig.validStartAngle}, 0, 0)`;

    return {
      center,
      radius,
      circumference,
      strokeDashoffset,
      rotationTransform,
    };
  }, [baseConfig.validSize, baseConfig.validStartAngle, baseConfig.validStrokeWidth, valueCalculations.percentage]);

  // Group 7: Format value for display - depends on the normalized value and formatter
  const valueText = useMemo(() => {
    return safeValueFormatter(valueCalculations.normalizedValue);
  }, [safeValueFormatter, valueCalculations.normalizedValue]);

  return (
    <ProgressCircleContextProvider
      center={circleGeometry.center}
      circumference={circleGeometry.circumference}
      id={id}
      maxValue={baseConfig.validMaxValue}
      minValue={baseConfig.validMinValue}
      normalizedValue={valueCalculations.normalizedValue}
      radius={circleGeometry.radius}
      rotationTransform={circleGeometry.rotationTransform}
      scope={__scopeProgressCircle}
      size={baseConfig.validSize}
      strokeDashoffset={circleGeometry.strokeDashoffset}
      strokeWidth={baseConfig.validStrokeWidth}
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

function ProgressCircle({ __scopeProgressCircle, ...props }: ScopedProps<ComponentProps<'div'>>): JSX.Element {
  return <div {...props} />;
}

/* -------------------------------------------------------------------------------------------------
 * Component: ProgressCircleSVG
 * -----------------------------------------------------------------------------------------------*/

const PROGRESS_CIRCLE_SVG_NAME = 'ProgressCircleSVG';

function ProgressCircleSVG({ __scopeProgressCircle, ...props }: ScopedProps<ComponentProps<'svg'>>): JSX.Element {
  const { size, id, valueText, maxValue, minValue, normalizedValue } = useProgressCircleContext(
    PROGRESS_CIRCLE_SVG_NAME,
    __scopeProgressCircle,
  );

  return (
    <svg
      aria-valuemax={maxValue}
      aria-valuemin={minValue}
      aria-valuenow={normalizedValue}
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

function ProgressCircleTrack({ __scopeProgressCircle, ...props }: ScopedProps<ComponentProps<'circle'>>): JSX.Element {
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
}: ScopedProps<ComponentProps<'circle'>>): JSX.Element {
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
}: ScopedProps<ComponentProps<'div'>>): JSX.Element {
  const { valueText } = useProgressCircleContext(PROGRESS_CIRCLE_VALUE_NAME, __scopeProgressCircle);

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
