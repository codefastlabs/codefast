---
"@codefast/tailwind-variants": minor
---

**Breaking:** a slot resolves the way upstream `tailwind-variants` resolves it. A compound slot reads the slot's own
props, so `item({ disabled: true })` no longer gets a `disabled: false` compound slot; a slot prop set to `null` or
`undefined` keeps the call's selection; a slot listed twice in a compound slot takes its classes twice on every path; an
empty compound slot adds no stray space; and calling a slot with `null` returns its classes instead of throwing. The
first call no longer reads the caller's props object when a slot is called later, so a reused props object cannot change
what it resolved to.
