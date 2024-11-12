import type { Modifiers, ModifiersStyles, Styles } from '@/types';
import { UI } from '@/ui';

import type { CSSProperties } from 'react';

export function getStyleForModifiers(
  dayModifiers: Modifiers,
  styles: Partial<Styles> = {},
  modifiersStyles: Partial<ModifiersStyles> = {},
) {
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
