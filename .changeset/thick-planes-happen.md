---
"@codefast/cli": minor
---

Teach `codefast audit comments` to catch a doc block detached from its declaration by a `//` run — TSDoc binds to the
nearest declaration, so the wedged comment silently orphans every tag above it.
