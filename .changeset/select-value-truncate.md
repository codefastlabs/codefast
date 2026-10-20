---
"@codefast/ui": patch
---

`SelectTrigger` truncates long values with an ellipsis instead of overflowing: the trigger can shrink (`min-w-0`,
`max-w-full`) and `SelectValue` renders as a truncating block. `line-clamp-1` combined with `flex` gave no ellipsis.
Icons inside the value stay inline.
