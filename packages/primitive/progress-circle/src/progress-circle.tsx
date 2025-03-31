'use client';

import type { Scope } from '@radix-ui/react-context';
import type { ComponentProps, ReactNode } from 'react';

import { createContextScope } from '@radix-ui/react-context';
import { useId, useMemo } from 'react';

/* -----------------------------------------------------------------------------
 * Context: ProgressCircleProvider
 * ---------------------------------------------------------------------------*/

const PROGRESS_CIRCLE_PROVIDER_NAME = 'ProgressCircleProvider';

type ScopedProps<P> = P & { __scopeProgressCircle?: Scope };

/**
 * Defines color thresholds based on progress values
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
 * Props for the ProgressCircleProvider context
 */
interface ProgressCircleContextValue {
  /**
   * Center coordinate of the circle (half of size)
   */
  center: number;

  /**
   * Total circumference of the circle for stroke calculations
   */
  circumference: number;

  /**
   * Clamped progress value, undefined for indeterminate state
   */
  clampedValue: number | undefined;

  /**
   * Unique identifier for the progress circle
   */
  id: string;

  /**
   * Maximum progress value
   */
  max: number;

  /**
   * Minimum progress value
   */
  min: number;

  /**
   * Radius of the circle for SVG rendering
   */
  radius: number;

  /**
   * CSS transform for rotating the progress indicator
   */
  rotationTransform: string;

  /**
   * Size of the progress circle in pixels
   */
  size: number;

  /**
   * Stroke dash offset for progress visualization
   */
  strokeDashoffset: number;

  /**
   * Width of the stroke for the progress circle
   */
  strokeWidth: number;

  /**
   * Threshold configuration for color changes
   */
  threshold: Threshold | undefined;

  /**
   * Raw progress value (can be null/undefined for indeterminate)
   */
  value: null | number | undefined;

  /**
   * Text representation of the current value for accessibility
   */
  valueText: string;
}

const [createProgressCircleContext, createProgressCircleScope] = createContextScope(PROGRESS_CIRCLE_PROVIDER_NAME);

const [ProgressCircleContextProvider, useProgressCircleContext] =
  createProgressCircleContext<ProgressCircleContextValue>(PROGRESS_CIRCLE_PROVIDER_NAME);

/* -----------------------------------------------------------------------------
 * Component: ProgressCircleProvider
 * ---------------------------------------------------------------------------*/

interface ProgressCircleProviderProps {
  /** React children to be rendered inside the progress circle */
  children: ReactNode;

  /** Custom function to format the numeric value for display */
  formatValue?: (value: number) => string;

  /** Unique identifier for the progress circle component */
  id?: string;

  /** Maximum value of the progress (defaults to 100) */
  max?: number;

  /** Minimum value of the progress (defaults to 0) */
  min?: number;

  /** Size of the progress circle in pixels */
  size?: number;

  /** Starting angle of the progress circle in degrees (0 = top) */
  startAngle?: number;

  /** Width of the progress circle's stroke in pixels */
  strokeWidth?: number;

  /** Array of threshold configurations for different value ranges */
  thresholds?: Threshold[];

  /** Current progress value (null for indeterminate state) */
  value?: null | number;
}

/**
 * Provides context for the ProgressCircle component
 *
 * Manages calculations for rendering the circular progress indicator,
 * including value clamping, sizing, thresholds, and indeterminate state.
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
 *   <ProgressCircleValue />
 * </ProgressCircleProvider>
 * ```
 */
function ProgressCircleProvider({
  __scopeProgressCircle,
  value,
  min = 0,
  max = 100,
  thresholds,
  strokeWidth = 4,
  size = 48,
  formatValue,
  id: propId,
  startAngle = -90,
  children,
}: ScopedProps<ProgressCircleProviderProps>): ReactNode {
  const uniqueId = useId();
  const id = propId || uniqueId;

  // Ensure size and stroke width are non-negative
  const validSize = Math.max(0, size);
  const validStrokeWidth = Math.max(0, strokeWidth);
  const validStartAngle = startAngle % 360;

  // Validate min and max, swap if min > max
  let validMin = min;
  let validMax = max;

  if (validMin > validMax) {
    [validMin, validMax] = [validMax, validMin];
  }

  // Handle indeterminate state
  const isIndeterminate = value === null || value === undefined;
  const clampedValue = isIndeterminate ? undefined : clamp(validMin, validMax, value);
  const range = validMax - validMin;
  const percentage = clampedValue !== undefined && range > 0 ? ((clampedValue - validMin) / range) * 100 : 0;
  const valueText =
    clampedValue !== undefined && formatValue ? formatValue(clampedValue) : `${Math.round(percentage)}%`;

  // Sort thresholds by value
  const sortedThresholds = useMemo(
    () => (thresholds && thresholds.length > 0 ? [...thresholds].sort((a, b) => a.value - b.value) : []),
    [thresholds],
  );

  // Determine an active threshold based on a clamped value
  const threshold = useMemo(() => {
    if (clampedValue === undefined) {
      return;
    }

    for (const sortedThreshold of sortedThresholds) {
      if (clampedValue <= sortedThreshold.value) {
        return sortedThreshold;
      }
    }

    return sortedThresholds.at(-1);
  }, [sortedThresholds, clampedValue]);

  // Calculate circle properties
  const center = validSize / 2;
  const radius = Math.max(0, center - validStrokeWidth / 2);
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const rotationTransform = `rotate(${validStartAngle}, 0, 0)`;

  return (
    <ProgressCircleContextProvider
      center={center}
      circumference={circumference}
      clampedValue={clampedValue} // Undefined for indeterminate
      id={id}
      max={validMax}
      min={validMin}
      radius={radius}
      rotationTransform={rotationTransform}
      scope={__scopeProgressCircle}
      size={validSize}
      strokeDashoffset={strokeDashoffset}
      strokeWidth={validStrokeWidth}
      threshold={threshold}
      value={value ?? 0}
      valueText={valueText}
    >
      {children}
    </ProgressCircleContextProvider>
  );
}

/* -----------------------------------------------------------------------------
 * Component: ProgressCircle
 * ---------------------------------------------------------------------------*/

/**
 * Root component for the progress circle
 *
 * Serves as a wrapper for other progress circle components.
 */
function ProgressCircle({ __scopeProgressCircle, ...props }: ScopedProps<ComponentProps<'div'>>): ReactNode {
  return <div {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: ProgressCircleSVG
 * ---------------------------------------------------------------------------*/

const PROGRESS_CIRCLE_SVG_NAME = 'ProgressCircleSVG';

type ProgressCircleSVGProps = ComponentProps<'svg'>;

/**
 * SVG container for the progress circle
 *
 * Renders the SVG with accessibility attributes and supports indeterminate state.
 */
function ProgressCircleSVG({ __scopeProgressCircle, ...props }: ScopedProps<ProgressCircleSVGProps>): ReactNode {
  const { size, id, valueText, max, min, clampedValue } = useProgressCircleContext(
    PROGRESS_CIRCLE_SVG_NAME,
    __scopeProgressCircle,
  );

  return (
    <svg
      aria-label="Progress"
      aria-valuemax={max}
      aria-valuemin={min}
      aria-valuenow={clampedValue} // Undefined for indeterminate state
      aria-valuetext={clampedValue === undefined ? undefined : valueText}
      height={size}
      id={id}
      role="progressbar"
      tabIndex={0}
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: ProgressCircleTrack
 * ---------------------------------------------------------------------------*/

const PROGRESS_CIRCLE_TRACK_NAME = 'ProgressCircleTrack';

type ProgressCircleTrackProps = ComponentProps<'circle'>;

/**
 * Background circle for the progress indicator
 *
 * Renders the static track of the progress circle.
 */
function ProgressCircleTrack({ __scopeProgressCircle, ...props }: ScopedProps<ProgressCircleTrackProps>): ReactNode {
  const { radius, strokeWidth, threshold, center } = useProgressCircleContext(
    PROGRESS_CIRCLE_TRACK_NAME,
    __scopeProgressCircle,
  );

  return (
    <circle
      aria-hidden="true"
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

/* -----------------------------------------------------------------------------
 * Component: ProgressCircleIndicator
 * ---------------------------------------------------------------------------*/

const PROGRESS_CIRCLE_INDICATOR_NAME = 'ProgressCircleIndicator';

type ProgressCircleIndicatorProps = ComponentProps<'circle'>;

/**
 * Foreground circle showing progress
 *
 * Renders the dynamic progress indicator with stroke dash properties.
 */
function ProgressCircleIndicator({
  __scopeProgressCircle,
  ...props
}: ScopedProps<ProgressCircleIndicatorProps>): ReactNode {
  const { radius, circumference, strokeDashoffset, rotationTransform, strokeWidth, threshold, center } =
    useProgressCircleContext(PROGRESS_CIRCLE_INDICATOR_NAME, __scopeProgressCircle);

  return (
    <circle
      aria-hidden="true"
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

/* -----------------------------------------------------------------------------
 * Component: ProgressCircleValue
 * ---------------------------------------------------------------------------*/

const PROGRESS_CIRCLE_VALUE_NAME = 'ProgressCircleValue';

interface ProgressCircleValueProps extends Omit<ComponentProps<'div'>, 'children'> {
  children?: ((context: { value: number | undefined; valueText: string }) => ReactNode) | ReactNode;
}

/**
 * Displays the current progress value
 *
 * Supports custom content or default value text rendering.
 */
function ProgressCircleValue({
  __scopeProgressCircle,
  children,
  ...props
}: ScopedProps<ProgressCircleValueProps>): ReactNode {
  const { valueText, clampedValue } = useProgressCircleContext(PROGRESS_CIRCLE_VALUE_NAME, __scopeProgressCircle);

  if (typeof children === 'function') {
    return children({ value: clampedValue, valueText });
  }

  return <div {...props}>{children || valueText}</div>;
}

/* -----------------------------------------------------------------------------
 * Helpers
 * -------------------------------------------------------------------------- */

/**
 * Clamps a value within a specified min/max range
 *
 * @param min - Minimum value
 * @param max - Maximum value
 * @param value - Value to clamp
 * @returns Clamped value
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
