'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Produce a smoothly animated numeric value in response to changes.
 *
 * Applies a time-based easing (easeOutQuad) between the current and target values
 * over the specified duration. When disabled, the value updates immediately.
 *
 * @param targetValue - Target number to animate toward; null resolves to 0.
 * @param duration - Animation duration in milliseconds.
 * @param animate - When false, bypasses animation and sets the value directly.
 * @returns The current (rounded) animated value.
 *
 * @example
 * ```tsx
 * const value = useAnimatedValue(75, 1000, true);
 * return <div>{value}%</div>;
 * ```
 */
export function useAnimatedValue(targetValue: null | number, duration: number, animate?: boolean): number {
  // Default to 0 when targetValue is null
  const actualTargetValue = targetValue ?? 0;

  // Current animated output
  const [animatedValue, setAnimatedValue] = useState(actualTargetValue);

  // Prevent stale closures inside RAF loop
  const animatedValueRef = useRef(actualTargetValue);

  useEffect(() => {
    animatedValueRef.current = animatedValue;
  }, [animatedValue]);

  useEffect(() => {
    if (!animate) {
      setAnimatedValue(actualTargetValue);

      return;
    }

    // Starting value
    const currentValue = animatedValueRef.current;

    // Total delta across the animation
    const valueRange = actualTargetValue - currentValue;

    // Start timestamp
    const startTime = performance.now();

    if (duration <= 0 || valueRange === 0) {
      setAnimatedValue(actualTargetValue);

      return;
    }

    // requestAnimationFrame id for cleanup
    let animationFrame: number;

    // RAF step
    const animateValue = (currentTime: number): void => {
      // Elapsed milliseconds
      const elapsedTime = currentTime - startTime;

      if (elapsedTime >= duration) {
        setAnimatedValue(actualTargetValue);
      } else {
        // Linear progress (0..1)
        const progress = elapsedTime / duration;

        // easeOutQuad easing
        const easeProgress = 1 - (1 - progress) * (1 - progress);

        // Interpolated value
        const nextValue = currentValue + valueRange * easeProgress;

        setAnimatedValue(nextValue);
        animationFrame = requestAnimationFrame(animateValue);
      }
    };

    animationFrame = requestAnimationFrame(animateValue);

    return (): void => {
      cancelAnimationFrame(animationFrame);
    };
  }, [actualTargetValue, duration, animate]);

  return Math.round(animatedValue);
}
