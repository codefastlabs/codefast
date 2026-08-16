---
"@codefast/cli": minor
---

Run the official `@microsoft/tsdoc` parser over every doc block in `codefast audit comments`, reporting each grammar
diagnostic at its line — bare `@words`, unescaped braces, split code spans, indented fences — instead of approximating
the grammar with regexes. `@since` is registered as the repo's one custom tag.
