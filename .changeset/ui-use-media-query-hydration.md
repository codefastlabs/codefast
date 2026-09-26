---
"@codefast/ui": patch
---

`useMediaQuery` reports `false` while hydrating and then the live match, so markup server-rendered for a desktop
hydrates on a phone. It read `matchMedia` during the first client render, so a matching query hydrated different markup
than the server sent and React discarded the tree to render it again; `SidebarProvider`, through `useIsMobile`, did this
on every phone.
