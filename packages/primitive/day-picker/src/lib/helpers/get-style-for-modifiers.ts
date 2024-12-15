import type { CSSProperties } from 'react';

import type { Modifiers, ModifiersStyles, Styles } from '@/lib/types';

import { UI } from '@/lib/constants/ui';

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

  for (const [modifier] of Object.entries(dayModifiers).filter(([, active]) => active)) {
    style = {
      ...style,
      ...modifiersStyles[modifier],
    };
  }

  return style;
}
