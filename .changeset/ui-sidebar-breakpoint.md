---
"@codefast/ui": minor
---

The width where `Sidebar` switches between the docked panel and the mobile sheet is one theme variable,
`--breakpoint-sidebar` (default `48rem`), which also mints a `sidebar:` variant. Redefine it in the app's `@theme`,
before or after the preset, and the docked layout, `SidebarInset`'s inset spacing, `SidebarRail`, the hover-only menu
actions and the JS switch to the sheet all follow it. The JS side matches `(width < …)`, the exact complement of the CSS
query, so a fractional width just under 768px no longer shows no sidebar at all; `SidebarRail` no longer shows inside
the mobile sheet.
