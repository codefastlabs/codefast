---
"@codefast/tailwind-variants": patch
---

A resolver whose callers keep re-reading more selections than its cache holds no longer grows without bound: an entry
read back from the older generation now counts toward the limit, together with the caller classes it remembers, so the
store retires a generation the way a fresh one does. A generation's limit is sized so a table whose cells take their
selection and `className` from data still fits once those classes are counted.
