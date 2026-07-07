---
"@codefast/ui": minor
---

Rename four APIs whose names misstated their role (Swift API Design Guidelines pass).

**Breaking:**

- `ProgressCircle`: `animate` → `animated` (a boolean should read as an assertion, not a bare verb) and `customLabel` → `renderLabel` (the prop holds a render function, not a label value; "custom" was filler). `useAnimatedValue`'s third parameter follows suit.
- `MessageScrollerItem`: `scrollAnchor` → `isScrollAnchor` (assertion form, matching the existing `isActive` convention). The emitted `data-scroll-anchor` attribute is unchanged.
- `UsePaginationProps` → `UsePaginationOptions` — a hook takes options, not component props.
