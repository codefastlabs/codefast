# Bench History Viewer Style Contract

This document locks the visual and interaction DNA for `src/server/client/index.html` and `app.js`.
Use it as a guardrail for future UI sprints so redesign work stays consistent with the existing look and feel.

## 1) Visual DNA (must preserve)

- Dark, calm, Apple-inspired material language with subtle depth.
- Glass surfaces (`.bh-glass*`) over a layered ambient background.
- One strong action accent (`--color-bh-blue`) and mostly neutral controls.
- Data-first typography: labels are quiet, values are clear, numeric fields are tabular/mono where helpful.

## 2) Token-first policy

- Add or update style values through `@theme` tokens (`--color-bh-*`, `--shadow-bh-*`, etc.).
- Avoid one-off hard-coded colors/shadows in component classes unless temporary and documented.
- Prefer semantic tokens (purpose-based) over raw palette names.

## 3) Component primitives to reuse

- Surfaces: `.bh-glass`, `.bh-glass--tight`, `.bh-glass--sticky`
- Cards: `.bh-card`
- Form fields: `.bh-field`, `.bh-focus`
- Segmented controls: `.bh-chart-toolbar`, `.bh-seg-btn`
- Labels/values: `.bh-lbl`, `.bh-val`, `.bh-metric__meta`, `.bh-metric__fig`

New UI should compose these primitives before introducing new component families.

## 4) Interaction and motion

- Keep transitions short and subtle (roughly 120-240ms).
- Respect `motion-reduce`; no essential information should depend on animation.
- Keep empty/loading/error states explicit and actionable.

## 5) Accessibility baseline (non-negotiable)

- Maintain visible focus states on all interactive controls.
- Keep ARIA labels/roles for controls, chart helpers, and status messaging.
- Preserve chart-to-table parity for screen-reader and copy/paste workflows.
- Maintain readable contrast on dark surfaces for body text and data values.

## 6) Information density rules

- Chart and scenario metrics are primary.
- Secondary explanatory text should stay concise and collapsible where possible.
- Add progressive disclosure before adding permanent above-the-fold blocks.

## 7) Naming and consistency

- Keep `bh-` prefix for component classes and modifiers.
- Keep wording consistent for global controls across benchmark packages (for example ratio toggles).
- Prefer explicit labels over clever labels in data-heavy controls.

## 8) Sprint guardrails

Before merging visual changes:

1. Compare side-by-side with current UI in both benchmark servers.
2. Verify keyboard navigation and focus visibility.
3. Verify chart interactions (zoom/pan/reset), empty states, and PNG export.
4. Check that new classes still map to tokenized values.

## 9) Extended patterns (2026 refresh)

- **Chart-first layout**: primary chart block appears before per-scenario metric cards; KPI overview follows metrics.
- **Run window**: `Runs shown` limits plotted points to the newest N runs after Environment filtering (state in URL as `w=`).
- **Command palette**: ⌘K / Ctrl+K for quick actions; keep chrome aligned with `.bh-glass` / `.bh-field`.
- **Shareable view**: URL hash encodes env, group, search, scenario, window, and display toggles; prefer `history.replaceState` over full reloads.
