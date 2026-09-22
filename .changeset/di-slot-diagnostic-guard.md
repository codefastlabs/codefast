---
"@codefast/di": patch
---

A `NoMatchingBindingError`'s "Available slots" diagnostic no longer throws when a bound slot carries a tag value that
cannot be stringified — a bigint, a null-prototype object, or one whose `toString` throws. `bindingSlotToString` (and
the dependency-graph edge label) now render such a value as `<unprintable>` through a shared `stringifyTagValue` guard,
so the real `NoMatchingBindingError` surfaces instead of a masking `TypeError`, matching the guard the request-side
diagnostic already had.
