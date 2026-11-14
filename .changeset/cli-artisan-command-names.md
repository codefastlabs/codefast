---
"@codefast/cli": minor
---

Commands are named `namespace:action`, as Laravel's Artisan names them, so a name says what it acts on and what it does:

| Before            | After                                     |
| ----------------- | ----------------------------------------- |
| `audit <name>`    | `audit:<name>` (`audit:links`, …)         |
| `mirror`          | `exports:generate`                        |
| `pack-slim`       | `publish:prepare`                         |
| `tag`             | `since:stamp`                             |
| `codefast` (bare) | lists the commands and exits `0`, not `2` |

`audit` alone still runs every audit. The config sections follow the commands: `mirror` becomes `exports` and `tag`
becomes `since`, and the `MirrorConfig` and `CodefastTagConfig` types become `ExportsConfig` and `SinceConfig`.
