---
"@codefast/ui": patch
"@codefast/theme": patch
"@codefast/tracking": patch
"@codefast/tailwind-variants": patch
"@codefast/di": patch
---

The README states the browser floor: Chrome and Edge 136, Firefox 136, and Safari 18.4 or later, the first releases that
ship every ES2025 builtin. `@codefast/di`'s README also says what a browser program without explicit resource management
does: it keeps `skipLibCheck` on and calls `dispose()` instead of `await using`.
