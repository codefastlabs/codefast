---
"@codefast/cli": minor
"@codefast/di": minor
"@codefast/di-testing": minor
"@codefast/tailwind-variants": minor
"@codefast/theme": minor
"@codefast/tracking": minor
"@codefast/ui": minor
---

Lower the Node.js floor from 24 to the lowest release the package, its dependencies and its full test suite run on:
22.12 for `@codefast/cli` and `@codefast/tailwind-variants`, 22.18 for `@codefast/di` and `@codefast/di-testing`, and
22.22.2 for `@codefast/theme`, `@codefast/tracking` and `@codefast/ui`. Each floor is type-checked against what Node 22
ships and proven by running the package's tests on that release in CI.
