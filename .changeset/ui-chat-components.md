---
"@codefast/ui": minor
---

Add chat surface components: `Attachment` (file/media card with upload states, three sizes, and horizontal/vertical orientations), `Bubble` (message bubble with seven variants, alignment, and reaction pills), `Message` (avatar + content row with start/end alignment), and `Marker` (inline feed divider). Each ships per-component and `./variants/*` subpath exports, stories, and unit tests.

Also adds `scroll-fade-*` (scroll-aware, RTL-mirrored edge fades) and `shimmer` (text loading shimmer) utilities to the foundation preset, used by these components and available on any scroller.
