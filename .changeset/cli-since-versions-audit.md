---
"@codefast/cli": minor
---

`audit:since-versions` (config `audit.sinceVersions`) reports every `@since` tag naming no version, or a version newer
than its package's own — the upcoming version typed by hand, which `since:stamp` never corrects. Each file is judged
against its own workspace package's manifest. `audit:comments` no longer checks `@since` versions, only their position,
so an allowlist entry for one moves from `audit.comments` to `audit.sinceVersions`.
