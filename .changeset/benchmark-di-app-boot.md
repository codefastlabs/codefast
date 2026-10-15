---
"@benchmark/di": patch
---

A new `app-boot-40` row prices an application's startup: a fresh container, a forty-service graph registered as classes
in each library's own idiom (32 singletons, 8 transient handlers), and every handler resolved once.
