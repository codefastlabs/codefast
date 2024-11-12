import { type CSSProperties } from 'react';

import { UI } from '@/lib/constants/ui';
import { type Modifiers, type ModifiersStyles, type Styles } from '@/lib/types';

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
