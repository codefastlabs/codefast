---
"@codefast/tracking": patch
---

Reset the consent banner's preferences layer during render instead of via a mirror-state effect — same reopen semantics
with one less state variable. Every exported declaration now carries a doc summary, and orphaned `@since 1.0.0-canary`
stamps are rewritten to the current track.
