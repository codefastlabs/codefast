---
"@codefast/di": minor
---

Rename the `hint` resolve parameter to `options` throughout — "hint" implied optional guidance the container may ignore, but the value is a hard selection criterion (`resolve` throws `NoMatchingBindingError` when nothing matches), so the name misstated its role. Positional call sites are unaffected; the one breaking surface is `NoMatchingBindingError.hint`, now `NoMatchingBindingError.options`.
