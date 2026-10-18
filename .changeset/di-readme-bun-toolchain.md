---
"@codefast/di": patch
---

The README's toolchain table lists Bun 1.4.3 or later as needing nothing: its transpiler lowers standard decorators and
supplies their metadata without `Symbol.metadata`. Bun 1.4.2 and earlier still inject the wrong values into a module
holding two decorated classes; 1.4.3 fixes that, checked with two accessor-injected and two constructor-injected classes
in one module, run directly and after `bun build`.
