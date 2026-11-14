---
"@codefast/cli": patch
---

An audit whose scan throws no longer stops a full `audit` run: it is reported as that audit's `UNEXPECTED` error, every
other audit still runs and reports, and the run exits `2`.
