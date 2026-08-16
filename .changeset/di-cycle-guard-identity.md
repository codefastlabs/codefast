---
"@codefast/di": patch
---

Key the resolution-path cycle guard on binding identity instead of token display names. Two distinct tokens created with
the same name (say, two `token("Config")` from different modules) on one dependency chain used to throw a false
`CircularDependencyError` for a legitimately acyclic graph — on the sync lane, on the deep-path membership set, and on
the async branch lane alike. The guard now compares binding ids read off the resolution frame stack, which moves in
lockstep with the path; the display-name array is kept solely for the error message, so a real cycle still reports the
same readable chain.
