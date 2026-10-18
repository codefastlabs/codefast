---
"@codefast/di": patch
---

`DiError.code` is now typed as `DiErrorCode`, a union of every code the library throws, exported from the package root,
so a `switch (error.code)` is checked by the compiler and a misspelled code no longer compiles. An
`AsyncActivationError` raised by a `@postConstruct` hook now names the token it was building —
`@postConstruct method 'init' of 'app:Cache' returned a Promise` — where it named only the method.
