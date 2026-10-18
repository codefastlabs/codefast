---
"@internal/design-system": patch
---

The README's Publishing section says Claude Code cannot publish the Codefast UI artifact: it was created from the Design
System Artifact type, and Claude Code's Artifact tool sends every publish with an `index.html` page entry, which belongs
to the type, so the server refuses it. It points to the surfaces the type's `SKILL.md` names (a claude.ai chat or
Cowork), and the steps now diff by size then sha256, leave whitespace-only SVG differences alone, and keep the type's
`index.html` out of the call.
