---
"@codefast/ui": patch
---

fix(ui): restore side-scoped slide animations on popover, hover-card, select, and tooltip

Reinstate ease-snappy easing with distinct open/close durations, scope slide-in
classes under data-open (and data-delayed-open for tooltip), and bring back
directional slide-out on close — matching the previously restored context menu,
dropdown menu, and menubar motion.
