import { type Dispatch, type SetStateAction, useState } from 'react';

export type DispatchStateAction<T> = Dispatch<SetStateAction<T>>;

/**
 * Manages a value that can either be controlled or uncontrolled.
 *
 * @example
 *   // Uncontrolled usage
 *   const [value, setValue] = useControlledValue(0, undefined);
 *
 *   // Controlled usage
 *   const [value, setValue] = useControlledValue(0, props.value);
 *
 * @param defaultValue - The initial value to use when the component is uncontrolled.
 * @param controlledValue - The value to use when the component is controlled. If undefined, the component is considered uncontrolled.
 * @returns A tuple containing the current value and a dispatcher to update the uncontrolled value.
 */
export function useControlledValue<T>(defaultValue: T, controlledValue: T | undefined): [T, DispatchStateAction<T>] {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);

  const value = controlledValue === undefined ? uncontrolledValue : controlledValue;

  return [value, setUncontrolledValue] as [T, DispatchStateAction<T>];
}
