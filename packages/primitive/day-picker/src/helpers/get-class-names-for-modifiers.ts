import { type ModifiersClassNames, type ClassNames } from '@/types';
import { DayFlag, SelectionState, UI } from '@/ui';

export function getClassNamesForModifiers(
  modifiers: Record<string, boolean>,
  classNames: ClassNames,
  modifiersClassNames: ModifiersClassNames = {},
): string[] {
  const modifierClassNames = Object.entries(modifiers)
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

  return modifierClassNames;
}
