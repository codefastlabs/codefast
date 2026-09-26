---
"@codefast/ui": patch
---

`SidebarProvider` registers its shortcut listener once, reading the latest state through an Effect Event, instead of
re-registering it after every toggle. With several providers on a page, the first one now keeps the shortcut on every
press. Re-registering moved the provider that had just toggled to the back of the listener queue, so a different sidebar
toggled on each press.
