---
"@codefast/ui": minor
---

`SidebarProvider`'s ⌘B / Ctrl+B shortcut leaves the key alone while focus is in an `input`, `textarea`, `select` or
contenteditable element, during IME composition, on auto-repeat, with Shift or Alt held, and once another handler has
called `preventDefault()`, so ⌘B in a rich-text editor bolds without collapsing the sidebar. The new `shortcutKey` prop
picks the key, matched case-insensitively, or turns the shortcut off with `false`.
