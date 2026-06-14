---
"@codefast/ui": patch
---

refactor(navigation-menu): pass the trigger `className` to `navigationMenuTriggerVariants` as a `ClassValue` array instead of pre-merging with `cn`, letting the variant resolver handle merging in one pass
