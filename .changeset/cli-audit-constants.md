---
"@codefast/cli": minor
---

`codefast audit constants` reports every upper-case `const` bound to a number in a library's sources whose comment names
none of the three kinds a number may be — a constant of the machine, a value the contract fixes, or one derived from
bind-time data. Sentinel values (`0`, `1`, `-1`) are exempt; `audit.constants.target` and `audit.constants.allowlist` in
`codefast.config` scope and except it.
