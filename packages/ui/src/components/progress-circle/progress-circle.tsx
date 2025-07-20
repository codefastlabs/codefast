"use client";

import type { ComponentProps, CSSProperties, JSX } from "react";

import { useCallback, useMemo } from "react";

import type { VariantProps } from "@/lib/utils";

import { progressCircleVariants } from "@/components/progress-circle/progress-circle.variants";
import * as ProgressCirclePrimitive from "@codefast-ui/progress-circle";
import { useAnimatedValue } from "@codefast/hooks";

/* -------------------------------------------------------------------------------------------------
 * Component: ProgressCircle
 * ----------------------------------------------------------------------------------------------- */

interface ProgressCircleProps
  extends Omit<ComponentProps<typeof ProgressCirclePrimitive.Provider>, "children" | "size">,
    VariantProps<typeof progressCircleVariants> {
  /**
   * Enables animation effect when value changes
   */
  animate?: boolean;

  /**
   * Duration of the animation in milliseconds
   */
  animationDuration?: number;

  /**
   * CSS class to customize the entire component
   */
  className?: string;

  /**
   * CSS classes to customize specific parts of the component
   */
  classNames?: {
    /**
     * Class for the progress indicator
     */
    indicator?: string;

    /**
     * Class for the label in the center of the circle
     */
    label?: string;

    /**
     * Class for the root element of the component
     */
    root?: string;

    /**
     * Class for the SVG element
     */
    svg?: string;

    /**
     * Class for the circle track
     */
    track?: string;
  };

  /**
   * Custom function to render content in the center of the circle
   * @param value - Current value of the component
   * @returns React element to display in the center of the circle
   */
  customLabel?: ({ value }: { value: number }) => JSX.Element;

  /**
   * Display the numeric value in the center of the circle
   */
  showValue?: boolean;

  /**
   * Custom size in pixels
   * When provided, this value overrides the size variant option
   */
  sizeInPixels?: number;
}

function ProgressCircle({
  animate = true,
  animationDuration = 1000,
  className,
  classNames,
  customLabel,
  showValue = false,
  size,
  sizeInPixels,
  strokeWidth,
  thickness = "regular",
  value = 0,
  variant = "default",
  ...props
}: ProgressCircleProps): JSX.Element {
  const displayValue = useAnimatedValue(value, animationDuration, animate);

  const actualSize = useMemo(() => sizeInPixels ?? getActualSize(size), [sizeInPixels, size]);

  const actualThickness = useMemo(
    () => strokeWidth ?? getStrokeWidth(thickness, actualSize),
    [strokeWidth, thickness, actualSize],
  );

  const slots = useMemo(
    () => progressCircleVariants({ size, thickness, variant }),
    [variant, size, thickness],
  );

  const shouldShowLabel = showValue || Boolean(customLabel);

  const renderLabel = useCallback(() => {
    if (customLabel) {
      return customLabel({ value: displayValue });
    }

    return `${String(displayValue)}%`;
  }, [customLabel, displayValue]);

  return (
    <ProgressCirclePrimitive.Provider
      size={actualSize}
      strokeWidth={actualThickness}
      value={value}
      {...props}
    >
      <ProgressCirclePrimitive.Root
        className={slots.root({ className: [className, classNames?.root] })}
      >
        <ProgressCirclePrimitive.SVG className={slots.svg({ className: classNames?.svg })}>
          <ProgressCirclePrimitive.Track
            className={slots.track({ className: classNames?.track })}
          />
          <ProgressCirclePrimitive.Indicator
            className={slots.indicator({ className: classNames?.indicator })}
            style={
              {
                transitionDuration: `${String(animationDuration)}ms`,
                transitionProperty: "stroke-dashoffset",
              } as CSSProperties
            }
          />
        </ProgressCirclePrimitive.SVG>
        {shouldShowLabel ? (
          <ProgressCirclePrimitive.Value className={slots.label({ className: classNames?.label })}>
            {renderLabel()}
          </ProgressCirclePrimitive.Value>
        ) : null}
      </ProgressCirclePrimitive.Root>
    </ProgressCirclePrimitive.Provider>
  );
}

ProgressCircle.displayName = "ProgressCircle";

/* -----------------------------------------------------------------------------
 * Helpers
 * -------------------------------------------------------------------------- */

/**
 * Maps size variants to actual pixel sizes
 */
const getActualSize = (size?: VariantProps<typeof progressCircleVariants>["size"]): number => {
  const sizeMap: Record<NonNullable<typeof size>, number> = {
    "2xl": 128,
    lg: 64,
    md: 48,
    sm: 32,
    xl: 96,
  };

  return size ? sizeMap[size] : 48;
};

/**
 * Calculates stroke width based on thickness variant and circle size
 */
const getStrokeWidth = (
  thickness: VariantProps<typeof progressCircleVariants>["thickness"],
  size: number,
): number => {
  const thicknessMap: Record<NonNullable<typeof thickness>, number> = {
    regular: Math.max(3, size * 0.05),
    thick: Math.max(4, size * 0.075),
    thin: Math.max(2, size * 0.025),
  };

  return thickness ? thicknessMap[thickness] : Math.max(3, size * 0.05);
};

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { ProgressCircle };
export type { ProgressCircleProps };
