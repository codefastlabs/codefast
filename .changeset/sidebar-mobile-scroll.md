---
"@codefast/ui": patch
---

`Sidebar` on mobile (the sheet below `--breakpoint-sidebar`) scrolls to its last item: the inner column gets `min-h-0`,
`SidebarHeader` and `SidebarFooter` no longer shrink, and `SidebarContent` contains overscroll so the page behind does
not scroll.
