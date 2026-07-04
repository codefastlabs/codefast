---
"@codefast/ui": patch
---

Fix a hydration mismatch in `SidebarMenuSkeleton`: its placeholder width was derived from `Math.random()`, which produced different values on the server and client. It now derives a stable, varied width (50–90%) from `useId`, so server and client render the same markup.
