---
"@codefast/ui": patch
---

Every focusable element now draws the same solid 2px `ring` outline, offset 2px, as `Button`. An element with no focus
style of its own (a plain link, `<summary>`, a custom `tabIndex` element) gets it from the base layer instead of the
browser's two-tone `auto` outline, and a component's own `outline-*` utilities still override it. The sidebar parts
(`SidebarMenuButton`, `SidebarMenuSubButton`, `SidebarMenuAction`, `SidebarGroupLabel`, `SidebarGroupAction`) and
`ResizableSeparator` draw focus as that outline instead of a box-shadow ring, so it also shows in forced-colors mode.
