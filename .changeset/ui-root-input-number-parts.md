---
"@codefast/ui": patch
---

The root entry, `@codefast/ui`, now re-exports `InputNumberField`, `InputNumberStepper`, `InputNumberIncrement` and
`InputNumberDecrement` with their prop types, which only `@codefast/ui/input-number` offered before, so an `InputNumber`
can be composed from the root import alone.
