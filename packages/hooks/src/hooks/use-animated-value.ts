import { useEffect, useRef, useState } from 'react';

/**
 * Hook to create a smoothly animated value when changes occur
 *
 * @param targetValue - The target value the animation should reach when complete
 * @param duration - The animation duration in milliseconds
 * @param animate - Enables the animation effect. If false, the value updates immediately
 *
 * @returns The rounded value currently being displayed during animation
 *
 * @example
 * ```jsx
 * // Use the hook to create an animated value
 * const animatedValue = useAnimatedValue(75, 1000, true);
 *
 * // Display the animated value
 * return <div>{animatedValue}%</div>;
 * ```
 */
export function useAnimatedValue(targetValue: number, duration: number, animate?: boolean): number {
  const [animatedValue, setAnimatedValue] = useState(targetValue);
  const animatedValueRef = useRef(targetValue);

  useEffect(() => {
    animatedValueRef.current = animatedValue;
  }, [animatedValue]);

  useEffect(() => {
    if (!animate) {
      setAnimatedValue(targetValue);

      return;
    }

    const currentValue = animatedValueRef.current;
    const valueRange = targetValue - currentValue;
    const startTime = performance.now();

    if (duration <= 0 || valueRange === 0) {
      setAnimatedValue(targetValue);

      return;
    }

    let animationFrame: number;

    const animateValue = (currentTime: number): void => {
      const elapsedTime = currentTime - startTime;

      if (elapsedTime >= duration) {
        setAnimatedValue(targetValue);
      } else {
        const progress = elapsedTime / duration;
        const easeProgress = 1 - (1 - progress) * (1 - progress); // easeOutQuad
        const nextValue = currentValue + valueRange * easeProgress;

        setAnimatedValue(nextValue);
        animationFrame = requestAnimationFrame(animateValue);
      }
    };

    animationFrame = requestAnimationFrame(animateValue);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [targetValue, duration, animate]);

  return Math.round(animatedValue);
}
