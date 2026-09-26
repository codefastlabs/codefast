---
"@codefast/ui": patch
---

`InputSearch` keeps its clear button disabled on a read-only field when `disabled={false}` is passed alongside
`readOnly`; the button stayed enabled there and cleared the read-only value.
