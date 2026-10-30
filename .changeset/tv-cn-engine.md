---
"@codefast/tailwind-variants": minor
---

**Breaking:** the merge engine is now [`cn`](https://github.com/shadcn-ui/cn), which replaces `tailwind-merge` as the
peer dependency (`cn >= 0.5.0`). `cn` produces the same output as `tailwind-merge` and merges a string no cache has seen
several times faster, so a first render, a cold page load and a `className` unique to its call all cost less. The
exported `cn` is the engine's own, whose argument cache answers a repeated call before any join. Install `cn` in place
of `tailwind-merge`; custom class groups come from `extendTailwindMerge` in `cn/config`, and an app that still imports
`tailwind-merge` elsewhere can alias it to `cn` so the bundle carries one engine.
