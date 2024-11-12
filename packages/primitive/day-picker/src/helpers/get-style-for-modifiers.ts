import { type CSSProperties } from 'react';

import { type Modifiers, type ModifiersStyles, type Styles } from '@/types';
import { UI } from '@/ui';

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
