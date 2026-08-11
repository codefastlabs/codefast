---
"@codefast/di": patch
---

`resolve(token, { tag: pair })` now reaches the registry's tagged index, which its own documentation had always claimed
it did. It never had: `singleTagOnlyOf` treated the presence of `tag` as a reason to give up on the fast lane, so the
shorthand — the form `README` reaches for and `ResolveOptions` advertised as the fast one — was the only spelling
excluded from it, and fell through to full candidate selection instead. Results were never wrong, only slower. Measured
paired against the previous build, alternating order, five passes, medians: **2.42×** on a single-tag resolve with the
pair hoisted and **2.38×** with it written inline, every pass agreeing; `{ tags: [pair] }` and the
`tagged-binding-resolve` row hold at parity, controls clean.

A request that carries a tag from both sources at once still declines the index, because two tags requested is not
something a one-tag index can answer without skipping the ambiguity check the full path would have run.

SPEC §3.5 now states the rule this fixes as normative — a fast path serving `tags: [pair]` must serve `tag: pair` — so
the two spellings cannot drift into different lanes again, and `tests/unit/resolution/tag-shorthand-parity.test.ts` pins
both the lane and the result equality across the value kinds `Object.is` and a `Map`'s SameValueZero disagree on.
`ResolveOptions.tag` and the README also stop implying the two forms differ in speed, and say what actually
distinguishes them: only `tags` expresses more than one tag, and only `tags` exists on `InjectOptions`.
