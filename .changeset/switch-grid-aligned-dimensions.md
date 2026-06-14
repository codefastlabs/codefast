---
"@codefast/ui": patch
---

refactor(switch): align default size to the spacing grid

Replace the hand-computed `h-[18.4px]` track and `translate-x-[calc(100%-2px)]` thumb offsets with on-grid utilities (`h-4.5`, `translate-x-3.5`/`translate-x-2.5`). The checked thumb travel is unchanged (14px default, 10px small); the default track is 0.4px shorter (18.4px → 18px).
