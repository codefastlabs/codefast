---
"@codefast/ui": minor
---

A part that adds behavior but no styling — the dialog, alert-dialog, sheet, drawer, popover, hover-card, tooltip,
dropdown-menu and collapsible triggers, `DialogClose`, `PopoverAnchor`, the menu groups and `SelectValue` among them —
no longer stamps its `data-slot` when it composes onto a child with `asChild`, so the child keeps its own. An `Avatar`
under `HoverCardTrigger asChild` now stays `data-slot="avatar"` and `AvatarGroup` rings it like its siblings, and a
`Button` under `TooltipTrigger asChild` stays `data-slot="button"`. A selector on such a part's slot, like
`[data-slot=tooltip-trigger]`, matches only when the part renders its own element. The new `behaviorSlot` in
`@codefast/ui/lib/slot` gives a behavior wrapper of your own the same rule.
