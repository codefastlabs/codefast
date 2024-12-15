import type { ClassNames, ModifiersClassNames } from '@/lib/types';

import { DayFlag, SelectionState, UI } from '@/lib/constants/ui';

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
  const classNamesArray: string[] = [classNames[UI.Day]];

  for (const [key, active] of Object.entries(modifiers)) {
    if (active) {
      if (modifiersClassNames[key]) {
        classNamesArray.push(modifiersClassNames[key]);
      } else if (classNames[DayFlag[key as DayFlag]]) {
        classNamesArray.push(classNames[DayFlag[key as DayFlag]]);
      } else if (classNames[SelectionState[key as SelectionState]]) {
        classNamesArray.push(classNames[SelectionState[key as SelectionState]]);
      }
    }
  }

  return classNamesArray;
}
