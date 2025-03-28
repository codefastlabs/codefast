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
 * ```tsx
 * // Use the hook to create an animated value
 * const animatedValue = useAnimatedValue(75, 1000, true);
 *
 * // Display the animated value
 * return <div>{animatedValue}%</div>;
 * ```
 */
export function useAnimatedValue(targetValue: number, duration: number, animate?: boolean): number {
  /**
   * The current value being displayed during the animation
   */
  const [animatedValue, setAnimatedValue] = useState(targetValue);

  /**
   * Reference to the latest animated value to prevent closure issues in animations
   */
  const animatedValueRef = useRef(targetValue);

  useEffect(() => {
    animatedValueRef.current = animatedValue;
  }, [animatedValue]);

  useEffect(() => {
    if (!animate) {
      setAnimatedValue(targetValue);

      return;
    }

    /**
     * The starting value for the animation
     */
    const currentValue = animatedValueRef.current;

    /**
     * The total change in value that will occur during animation
     */
    const valueRange = targetValue - currentValue;

    /**
     * Timestamp when the animation started
     */
    const startTime = performance.now();

    if (duration <= 0 || valueRange === 0) {
      setAnimatedValue(targetValue);

      return;
    }

    /**
     * ID for the animation frame to enable cancellation in cleanup
     */
    let animationFrame: number;

    /**
     * Updates the animated value based on elapsed time
     *
     * @param currentTime - The current timestamp provided by requestAnimationFrame
     */
    const animateValue = (currentTime: number): void => {
      /**
       * Time elapsed since animation started in milliseconds
       */
      const elapsedTime = currentTime - startTime;

      if (elapsedTime >= duration) {
        setAnimatedValue(targetValue);
      } else {
        /**
         * Linear animation progress from 0 to 1
         */
        const progress = elapsedTime / duration;

        /**
         * Eased animation progress using easeOutQuad formula
         */
        const easeProgress = 1 - (1 - progress) * (1 - progress);

        /**
         * Calculated value for the current animation frame
         */
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
