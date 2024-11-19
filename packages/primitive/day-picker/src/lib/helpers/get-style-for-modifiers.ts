import { type CSSProperties } from 'react';

import { UI } from '@/lib/constants/ui';
import { type Modifiers, type ModifiersStyles, type Styles } from '@/lib/types';

/**
 * Retrieves the style for the given day modifiers by merging base styles with modifier-specific styles.
 *
 * @param dayModifiers - An object containing boolean values for various day modifiers.
 * @param styles - An optional object containing base styles.
 * @param modifiersStyles - An optional object containing styles specific to each modifier.
 * @returns - A CSSProperties object representing the combined style for the day.
 */
export function getStyleForModifiers(
  dayModifiers: Modifiers,
  styles: Partial<Styles> = {},
  modifiersStyles: Partial<ModifiersStyles> = {},
): CSSProperties {
  let style: CSSProperties = { ...styles[UI.Day] };

  Object.entries(dayModifiers)
    .filter(([, active]) => active)
    .forEach(([modifier]) => {
      style = {
        ...style,
        ...modifiersStyles[modifier],
      };
    });

  return style;
}
