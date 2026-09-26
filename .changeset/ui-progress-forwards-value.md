---
"@codefast/ui": patch
---

`Progress` forwards `value` and `max` to Radix, so a bar exposes `aria-valuenow`, `aria-valuetext`, `data-value` and a
`loading`/`complete` `data-state`, and `getValueLabel` takes effect. It kept `value` to place the fill and never passed
it on, so every bar announced as indeterminate. The fill now scales by `max` and clamps to it, so `value={3} max={5}`
fills 60% of the bar, not 3%, and what the bar draws is what it announces.
