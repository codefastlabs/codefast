---
"@internal/benchmark-harness": patch
"@benchmark/di": patch
"@benchmark/tailwind-variants": patch
---

The generated `RESULTS.md` separates a time from its unit with a plain space instead of a non-breaking one, so the page
holds no invisible characters for search, diffs or copy to trip on.
