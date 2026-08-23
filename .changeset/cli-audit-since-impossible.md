---
"@codefast/cli": minor
---

`audit comments` gains a `since-impossible` rule: an `@since` tag naming a version above the owning package's current
version (compared by SemVer precedence, prerelease-aware) now fails the audit, so a stamp minted from a wrong
`package.json` version dies in CI instead of fossilizing. The tag subcommand's version lookup moves into
`core/workspace` so both subcommands share one implementation.
