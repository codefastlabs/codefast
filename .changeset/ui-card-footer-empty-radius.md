---
"@codefast/ui": minor
---

Refine two surfaces after comparing with shadcn radix-nova:

- `CardFooter` is now a distinct tinted tray by default (`border-t bg-muted/50` with full `--card-spacing` padding). `Card` drops its bottom padding when a footer is present (`has-data-[slot=card-footer]:pb-0`) so the tint reaches the card's bottom edge. Footers that previously relied on the transparent, opt-in-border behavior will now render with a background and top border.
- `Empty` uses `rounded-xl` instead of `rounded-lg`, matching `Card`'s corner radius for a consistent container language.
