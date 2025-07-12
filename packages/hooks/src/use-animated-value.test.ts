import { act, renderHook } from "@testing-library/react";

import { useAnimatedValue } from "@/use-animated-value";

describe("useAnimatedValue", () => {
  let originalRequestAnimationFrame: typeof globalThis.requestAnimationFrame;
  let originalCancelAnimationFrame: typeof globalThis.cancelAnimationFrame;
  let originalPerformanceNow: typeof performance.now;

  // Improve mocks to ensure proper functionality
  let animationFrameCallback: ((time: number) => void) | null = null;

  const requestAnimationFrameMock = jest.fn<number, [(time: number) => void]>((callback) => {
    animationFrameCallback = callback;

    return 1; // Return a fake ID
  });

  const cancelAnimationFrameMock = jest.fn();

  // Mock for performance.now
  let currentTime: number;
  let performanceNowMock: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();

    // Initialize mocks and time
    currentTime = 0;
    performanceNowMock = jest.fn(() => currentTime);

    // Store original functions
    originalRequestAnimationFrame = globalThis.requestAnimationFrame;
    originalCancelAnimationFrame = globalThis.cancelAnimationFrame;
    originalPerformanceNow = performance.now.bind(performance);

    // Assign mock functions
    globalThis.requestAnimationFrame = requestAnimationFrameMock;
    globalThis.cancelAnimationFrame = cancelAnimationFrameMock;
    performance.now = performanceNowMock;

    // Reset mocks and time
    currentTime = 0;
    animationFrameCallback = null;
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original functions
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    globalThis.cancelAnimationFrame = originalCancelAnimationFrame;
    performance.now = originalPerformanceNow;

    jest.useRealTimers();
  });

  test("returns the target value immediately when animate is false", () => {
    const { result } = renderHook(() => useAnimatedValue(100, 1000, false));

    expect(result.current).toBe(100);
  });

  test("returns the target value immediately when duration <= 0", () => {
    const { result } = renderHook(() => useAnimatedValue(100, 0, true));

    expect(result.current).toBe(100);

    const { result: negativeResult } = renderHook(() => useAnimatedValue(100, -10, true));

    expect(negativeResult.current).toBe(100);
  });

  test("returns the target value immediately when there is no value change", () => {
    const { result } = renderHook(() => useAnimatedValue(100, 1000, true));

    expect(result.current).toBe(100);
  });

  test("animates the value over time", () => {
    // Start with a value of 0 and animate to 100
    const { result, rerender } = renderHook(
      ({ targetValue, duration, animate }) => useAnimatedValue(targetValue, duration, animate),
      { initialProps: { targetValue: 0, duration: 1000, animate: true } },
    );

    // Initial value is 0
    expect(result.current).toBe(0);

    // Update to 100
    rerender({ targetValue: 100, duration: 1000, animate: true });

    // After rerender, requestAnimationFrame should be called
    expect(requestAnimationFrameMock).toHaveBeenCalledWith(expect.any(Function));

    // Simulate the first animation frame at time 0
    act(() => {
      if (animationFrameCallback) {
        currentTime = 0;
        animationFrameCallback(currentTime);
      }
    });

    // Still 0 because no time has passed
    expect(result.current).toBe(0);

    // Simulate an animation frame in the middle (500 ms)
    act(() => {
      if (animationFrameCallback) {
        currentTime = 500; // 50% of the duration
        animationFrameCallback(currentTime);
      }
    });

    // With easeOutQuad, the value at the midpoint will be > 50% of the total value
    // Should be greater than 0 but less than 100
    expect(result.current).toBeGreaterThan(0);
    expect(result.current).toBeLessThan(100);

    // More specific check with easeOutQuad at 50% duration typically results in about 75% progress
    expect(result.current).toBeCloseTo(75, -1); // Allow for a large margin of error

    // Simulate the final animation frame (1000 ms)
    act(() => {
      if (animationFrameCallback) {
        currentTime = 1000; // 100% of the duration
        animationFrameCallback(currentTime);
      }
    });

    // After the animation ends, the value should be 100
    expect(result.current).toBe(100);
  });

  test("calls cancelAnimationFrame when unmounted", () => {
    const { unmount, rerender } = renderHook(
      ({ targetValue, duration, animate }) => useAnimatedValue(targetValue, duration, animate),
      { initialProps: { targetValue: 0, duration: 1000, animate: true } },
    );

    rerender({ targetValue: 100, duration: 1000, animate: true });

    unmount();

    expect(cancelAnimationFrameMock).toHaveBeenCalledWith(1);
  });

  test("stops animation when animate changes from true to false", () => {
    const { result, rerender } = renderHook(
      ({ targetValue, duration, animate }) => useAnimatedValue(targetValue, duration, animate),
      { initialProps: { targetValue: 0, duration: 1000, animate: true } },
    );

    rerender({ targetValue: 100, duration: 1000, animate: true });

    // Simulate part of the animation
    act(() => {
      if (animationFrameCallback) {
        currentTime = 500;
        animationFrameCallback(currentTime);
      }
    });

    // Value is in the process of animating (between 0 and 100)
    const intermediateValue = result.current;

    expect(intermediateValue).toBeGreaterThan(0);
    expect(intermediateValue).toBeLessThan(100);

    // Turn off animation
    rerender({ targetValue: 100, duration: 1000, animate: false });

    // Value should immediately become the target value
    expect(result.current).toBe(100);
    expect(cancelAnimationFrameMock).toHaveBeenCalledWith(1);
  });

  test("changes the target value during animation", () => {
    const { result, rerender } = renderHook(
      ({ targetValue, duration, animate }) => useAnimatedValue(targetValue, duration, animate),
      { initialProps: { targetValue: 0, duration: 1000, animate: true } },
    );

    // Update to 100
    rerender({ targetValue: 100, duration: 1000, animate: true });

    // Simulate part of the animation
    act(() => {
      if (animationFrameCallback) {
        currentTime = 500;
        animationFrameCallback(currentTime);
      }
    });

    // Store the intermediate value
    const intermediateValue = result.current;

    // Change the target value to 200 during animation
    rerender({ targetValue: 200, duration: 1000, animate: true });

    // Check that a new animation has started
    expect(cancelAnimationFrameMock).toHaveBeenCalledWith(1);
    expect(requestAnimationFrameMock).toHaveBeenCalledTimes(3); // Initial + after each rerender

    // Continue the new animation
    act(() => {
      if (animationFrameCallback) {
        currentTime = 1000; // Time 0 of the new animation + 500 ms
        animationFrameCallback(currentTime);
      }
    });

    // Check the animation result after 500 ms (50% of the new animation)
    // Value should be between the intermediate value and 200
    expect(result.current).toBeGreaterThan(intermediateValue);
    expect(result.current).toBeLessThan(200);

    // Complete the animation
    act(() => {
      if (animationFrameCallback) {
        currentTime = 1500; // End time of the new animation
        animationFrameCallback(currentTime);
      }
    });

    // After the animation ends, the value should be 200
    expect(result.current).toBe(200);
  });

  test("changes duration during animation", () => {
    const { result, rerender } = renderHook(
      ({ targetValue, duration, animate }) => useAnimatedValue(targetValue, duration, animate),
      { initialProps: { targetValue: 0, duration: 1000, animate: true } },
    );

    // Update to 100 with a 1000 ms duration
    rerender({ targetValue: 100, duration: 1000, animate: true });

    // Simulate part of the animation
    act(() => {
      if (animationFrameCallback) {
        currentTime = 500;
        animationFrameCallback(currentTime);
      }
    });

    // Change duration to 2000 ms during animation
    rerender({ targetValue: 100, duration: 2000, animate: true });

    // Continue animation with the new duration
    act(() => {
      if (animationFrameCallback) {
        currentTime = 1500; // 75% of the new duration (1500/2000)
        animationFrameCallback(currentTime);
      }
    });

    // With easeOutQuad at 75% of the duration, the value will be close to the target
    expect(result.current).toBeGreaterThan(75);
    expect(result.current).toBeLessThan(100);

    // Complete the animation
    act(() => {
      if (animationFrameCallback) {
        currentTime = 2500; // End time of the new animation
        animationFrameCallback(currentTime);
      }
    });

    // After the animation ends, the value should be 100
    expect(result.current).toBe(100);
  });
});
