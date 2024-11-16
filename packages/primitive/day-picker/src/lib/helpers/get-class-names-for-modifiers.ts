import { DayFlag, SelectionState, UI } from '@/lib/constants/ui';
import { type ClassNames, type ModifiersClassNames } from '@/lib/types';

/**
 * Generates an array of class names based on the provided modifiers and corresponding class names.
 *
 * @param modifiers - A record where the key is a modifier name and the value is a boolean indicating whether the
 *   modifier is active.
 * @param classNames - An object mapping modifier names to their corresponding class names.
 * @param modifiersClassNames - An optional object mapping specific modifiers to their custom class names.
 * @returns An array of class names that match the active modifiers.
 */
export function getClassNamesForModifiers(
  modifiers: Record<string, boolean>,
  classNames: ClassNames,
  modifiersClassNames: ModifiersClassNames = {},
): string[] {
  return Object.entries(modifiers)
    .filter(([, active]) => active)
    .reduce<string[]>(
      (previousValue, [key]) => {
        if (modifiersClassNames[key]) {
          previousValue.push(modifiersClassNames[key]);
        } else if (classNames[DayFlag[key as DayFlag]]) {
          previousValue.push(classNames[DayFlag[key as DayFlag]]);
        } else if (classNames[SelectionState[key as SelectionState]]) {
          previousValue.push(classNames[SelectionState[key as SelectionState]]);
        }

        return previousValue;
      },
      [classNames[UI.Day]],
    );
}
