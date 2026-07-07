---
"@codefast/tracking": minor
---

Rebuild `ConsentBanner` as composable compound parts (`ConsentBannerTitle`/`Description`/`Actions`/`Accept`/`Reject`/`Customize`/`Preferences`/`Category`/`Save`) — the root owns visibility (`needsPrompt`, overridable via `open` for a "Cookie settings" reopen) and the preferences-layer state, action parts wire their own clicks and compose the consumer's `onClick`, so any markup including a design system's button styles slots in via `className`. The monolithic `message`/`acceptLabel`/`categories` props are gone. An optional plain-CSS default theme ships at `@codefast/tracking/css/consent.css` — data-slot selectors, `--consent-*` custom properties with `light-dark()` fallbacks, zero Tailwind dependency.
