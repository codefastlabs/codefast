---
"@codefast/ui": patch
---

refactor(ui): drop redundant single-arg `cn(className)` in Breadcrumb, CalendarRoot, AlertDialogAction/Cancel, and SidebarTrigger — `className` already forwards through `...props`, so the extra destructure and wrapper added nothing
