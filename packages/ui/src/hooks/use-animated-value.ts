import { useEffect, useRef, useState } from "react";

/**
 * Produces a smoothly animated numeric value in response to changes.
 *
 * Applies a time-based easing (easeOutQuad) between the current and target values
 * over the specified duration. When disabled, the value updates immediately.
 *
 * @param targetValue - Target number to animate toward; null resolves to 0.
 * @param duration - Animation duration in milliseconds.
 * @param animated - When false, bypasses animation and sets the value directly.
 * @returns The current (rounded) animated value.
 *
 * @example
 * ```tsx
 * const value = useAnimatedValue(75, 1000, true);
 * return <div>{value}%</div>;
 * ```
 *
 * @since 0.3.16-canary.0
 */
export function useAnimatedValue(targetValue: null | number, duration: number, animated?: boolean): number {
  // Default to 0 when targetValue is null
  const actualTargetValue = targetValue ?? 0;

  // Current animated output
  const [animatedValue, setAnimatedValue] = useState(actualTargetValue);

  // Prevent stale closures inside RAF loop
  const animatedValueRef = useRef(actualTargetValue);

  // Animate only when asked and there is a positive window; otherwise the target is shown directly.
  const shouldAnimate = animated === true && duration > 0;

  // Pin the state to the target while animation is off, so re-enabling eases from the shown value.
  if (!shouldAnimate && animatedValue !== actualTargetValue) {
    setAnimatedValue(actualTargetValue);
  }

  useEffect(() => {
    if (!shouldAnimate) {
      animatedValueRef.current = actualTargetValue;

      return;
    }

    // Starting value
    const currentValue = animatedValueRef.current;

    // Total delta across the animation
    const valueRange = actualTargetValue - currentValue;

    if (valueRange === 0) {
      return;
    }

    // Start timestamp
    const startTime = performance.now();

    // requestAnimationFrame id for cleanup
    let animationFrame: number;

    // RAF step
    const animateValue = (currentTime: number): void => {
      // Elapsed milliseconds
      const elapsedTime = currentTime - startTime;

      if (elapsedTime >= duration) {
        animatedValueRef.current = actualTargetValue;
        setAnimatedValue(actualTargetValue);
      } else {
        // Linear progress (0..1)
        const progress = elapsedTime / duration;

        // easeOutQuad easing
        const easeProgress = 1 - (1 - progress) * (1 - progress);

        // Interpolated value
        const nextValue = currentValue + valueRange * easeProgress;

        animatedValueRef.current = nextValue;
        setAnimatedValue(nextValue);
        animationFrame = requestAnimationFrame(animateValue);
      }
    };

    animationFrame = requestAnimationFrame(animateValue);

    return (): void => {
      cancelAnimationFrame(animationFrame);
    };
  }, [actualTargetValue, duration, shouldAnimate]);

  return Math.round(animatedValue);
}
