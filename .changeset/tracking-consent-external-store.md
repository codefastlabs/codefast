---
"@codefast/tracking": minor
---

Rebuild the consent layer on `useSyncExternalStore` and expose `data-slot` styling hooks on the consent UI.

- `useConsent` treats the stored `ConsentRecord` as the single source of truth: the server snapshot is always "no decision yet" (hydration-safe by construction on prerendered pages), a decision made in one tab syncs to every other tab, and a record saved under an older `policyVersion` is ignored so bumping the version re-prompts as documented.
- **Breaking:** `ConsentStorage` gains a required `subscribe(listener)` method — custom implementations must notify on changes. `createLocalStorageConsentStorage` implements it (same-tab saves plus the cross-tab `storage` event) and now degrades a blocked `localStorage` (private mode/quota) to a session-scoped in-memory record instead of re-prompting in a loop.
- **Breaking:** `ConsentBanner` renders a labeled region instead of a non-modal `<dialog>` (which neither traps focus nor blocks, so the dialog semantics over-promised). Both components extend their host element's `ComponentProps` and expose `data-slot` attributes (`consent-message`, `consent-actions`, `consent-action`, `consent-toggle`) for Tailwind `**:data-[slot=...]` styling.
