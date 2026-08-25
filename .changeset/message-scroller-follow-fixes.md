---
"@codefast/ui": minor
---

Harden MessageScroller follow-output and turn anchoring. Follow-bottom now releases on a reader's real upward scroll —
surviving the autoscroll suppression window and slow sub-pixel drags — drops whenever `autoScroll` turns off, and
re-arms cleanly after an anchored turn unmounts. A freshly anchored turn holds at the reading line while the reply
streams, hands off to follow-bottom in a single scroll command once the reply fills the viewport, and the handoff no
longer false-fires when the viewport itself shrinks (keyboard, resize). ResizeObserver handling coalesces onto one
shared frame (fixing the "loop completed with undelivered notifications" error) with a synchronous fast path while
following, so streaming stays glued to the live edge without a one-frame gap. The scroll snapshot from
`useMessageScrollerScrollable` gains a `following` field (mirrored as a `data-following` attribute) and `end` now always
reports true geometry; `MessageScrollerButton` derives its quiescence from `end && !following` instead of a masked
snapshot.
