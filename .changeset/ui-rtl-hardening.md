---
"@codefast/ui": minor
---

Complete RTL hardening across the component library, closing the last physical-direction gaps and making the carousel direction-aware.

- `AvatarGroup` now flips its overlap in RTL (`rtl:space-x-reverse`).
- `SidebarRail`'s off-canvas drag line mirrors correctly (`after:start-full`).
- **`Carousel` is now direction-aware:** it forwards the resolved reading direction to Embla (so drag/snap physics mirror in RTL) and swaps the arrow-key mapping (in RTL the **Left** arrow advances, **Right** retreats). An explicit `opts.direction` still wins. This is a behavior change for RTL consumers who relied on the previous physical arrow-key mapping.

Also adds an internal `audit:rtl` script and a Direction (LTR/RTL) Storybook toolbar to keep physical-direction utilities from regressing.
