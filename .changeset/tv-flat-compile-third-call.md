---
"@codefast/tailwind-variants": patch
---

A component without slots compiles its plan on the third call instead of the second, so one rendered exactly twice —
common on a server render or a page that shows it twice — pays for no plan; a cold call without slots costs less than a
compile, and the gap grows with the number of variants. Slot components still compile on their second call.
