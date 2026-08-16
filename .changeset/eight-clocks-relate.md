---
"@codefast/cli": minor
---

Teach `codefast audit comments` three TSDoc checks: a `{@link}` whose target has no mention outside links (a rename that
orphaned it), a `@param`/`@typeParam` missing the hyphen before its description, and a `@since` that is not the block's
last tag. The link check resolves against the scanned tree, so it runs on full-tree scans only.
