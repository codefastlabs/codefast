---
"@codefast/cli": minor
---

Add `codefast audit comments`, which reports section dividers that are not in the repo's one allowed form and rewrites
them with `--fix`. A divider is a label and nothing else, so a rule-framed comment carrying prose is read as a doc block
and left alone; everything the audit does report is mechanical, which makes a red run one `--fix` from green.
