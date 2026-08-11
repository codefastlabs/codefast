---
"@codefast/cli": minor
---

`codefast audit links` — a read-only scan for markdown cross-references that resolve to nothing.

It reports three things: a relative path that does not exist, an in-document anchor with no matching heading or
`<a id>`, and an anchor into another document that the target does not offer. The third is why the command exists — a
wrong `#fragment` fails silently in a browser by scrolling to the top, so unlike a broken path it leaves no trace to
notice. Six such breakages had accumulated in this repo before anything looked.

External URLs are skipped as somebody else's to verify, and so are links inside fenced code, which are examples rather
than references. Exits non-zero when breakages remain, so it can gate CI; intentional exceptions go in
`audit.links.allowlist` as a bare target or `repo/relative/doc.md:target`.

The scan defaults to the repo root rather than a configured path. A link audit scoped to one package cannot see the
cross-package references, which are the ones most likely to rot.
