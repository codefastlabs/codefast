---
"@codefast/theme": patch
---

Mirror the committed appearance ref in a layout effect so a programmatic `setAppearance` landing before the passive
flush compares against the just-committed appearance instead of the previous one.
