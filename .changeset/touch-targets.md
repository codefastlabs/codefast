---
"@codefast/ui": minor
---

Touch-size hit areas on narrow screens. A new `--breakpoint-touch` (default `40rem`) mints the `max-touch:` variant;
below it, buttons grow to at least 40px, icon buttons to 44px, and inputs, select triggers, select, dropdown-menu and
command items to 44px, tabs to 40px. Desktop sizes are unchanged. Apps move the breakpoint with
`@theme { --breakpoint-touch: … }`.
