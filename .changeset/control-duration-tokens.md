---
"@codefast/ui": patch
---

feat(motion): add control duration tokens and apply them to form controls

Define two semantic timing tokens in the motion foundation and use them across Switch, Checkbox (+ Cards/Group) and Radio (+ Group/Cards):

- `--transition-duration-control: 200ms` — container/ring (switch track, checkbox & radio box)
- `--transition-duration-control-indicator: 300ms` — the moving part (switch thumb, check/dot, native radio dot)

They live in the `--transition-duration-*` namespace so they mint clean `duration-control` / `duration-control-indicator` utilities. Because `animate-in` falls back to `--tw-duration`, the same `duration-*` utility drives both the state transitions and the indicator keyframes — one token, one utility, no arbitrary `duration-(--…)` syntax.
