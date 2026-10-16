---
"@codefast/cli": patch
---

`codefast audit comments` reads a titled rule that opens a block comment without closing it, such as
`/* ── Status colours ──` followed by prose and `*/`, as the heading of a doc block rather than a divider, so `--fix` no
longer closes the comment on that line and leaves the prose below it outside the comment.
