---
"@codefast/ui": patch
---

fix(ui): flip transforms and resize cursors under `dir="rtl"`

Logical properties (`start-*`) flip in RTL but the paired `translate-x`/`cursor`
utilities do not, leaving elements offset. Add `rtl:` overrides so Dialog and
AlertDialog stay centred, the Switch thumb slides the correct way, and the
Carousel buttons, Resizable handle, Select popper offset, Sidebar rail cursors,
and RadioCards indicator all mirror correctly.
