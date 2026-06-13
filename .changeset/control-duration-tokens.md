---
"@codefast/ui": patch
---

feat(motion): add control duration tokens and apply them to form controls

Define two semantic timing tokens in the motion foundation and use them across Switch, Checkbox (+ Cards/Group) and Radio (+ Group/Cards):

- `--animation-duration-control: 200ms` — container/ring transitions (switch track, checkbox & radio box)
- `--animation-duration-control-indicator: 300ms` — the moving part (switch thumb slide, check/dot keyframes, native radio dot)

Keyframe indicators read the token via `animation-duration-control-indicator`; the transition-based parts reference it with `duration-(--animation-duration-control[-indicator])`, so all control timings have a single source of truth.
