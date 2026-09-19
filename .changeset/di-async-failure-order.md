---
"@codefast/di": patch
---

An async level with several dependencies, and a `resolveAllAsync` collection, report the first failing dependency in
declaration order — the order the sync lanes report — instead of whichever rejection happened to settle first. Every
dependency still starts before anything is reported. A node with one dependency awaits it directly, with no fan-out to
settle.
