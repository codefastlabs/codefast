---
"@codefast/cli": patch
---

The audits share one `--json` shape, one exit-code rule and one repo-root prelude instead of a copy per audit, and no
command re-validates a request it built itself. Output and exit codes are unchanged.
