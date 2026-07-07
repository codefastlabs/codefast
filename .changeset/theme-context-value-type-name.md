---
"@codefast/theme": minor
---

Rename `AppearanceContextType` to `AppearanceContextValue` — the "Type" suffix carried no information (every exported type is a type), while "Value" states the role: the payload provided through `AppearanceContext` and returned by `useAppearance`.
