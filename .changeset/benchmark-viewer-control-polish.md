---
"@internal/benchmark-viewer": patch
---

Two control-panel visual fixes. Every filter `select` now draws its own chevron inset `0.75rem` from the right edge
(`appearance: none` plus a custom glyph) instead of the browser arrow jammed against the border. And the report-download
links drop their vivid accent blue for the same muted button treatment as the panel's other controls, so they no longer
clash with the surrounding grey UI.
