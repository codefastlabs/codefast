---
"@codefast/ui": patch
---

`SelectContent` insets its list by 4px whether or not the items sit in a `SelectGroup`. The inset lived on the group, so
items placed straight in `SelectContent` touched the popup's edge and an item-aligned popup opened 4px right of its
trigger. The viewport now carries the inset and keeps it when the keyboard scrolls an item into view. A group adds 8px
only after another group, and a `SelectSeparator` between groups keeps 4px on either side, as in the other menus.
