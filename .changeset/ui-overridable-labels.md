---
"@codefast/ui": minor
---

Every string a component renders on an element the app cannot reach through props now comes from a prop that defaults to
the English text, so a UI in another language can name those controls: `InputPassword` takes `revealLabel` and
`concealLabel`; `InputSearch` takes `clearLabel`; `DialogContent`, `DialogFooter`, `SheetContent` and `CommandDialog`
take `closeLabel`; and `Sidebar` takes `mobileTitle` for its mobile sheet, which drops its filler description.
`PaginationEllipsis` and `BreadcrumbEllipsis` drop screen-reader text that their `aria-hidden` wrapper kept from ever
being read.

**Breaking:** `InputNumber`'s `ariaIncrementLabel` and `ariaDecrementLabel` are renamed `incrementLabel` and
`decrementLabel`, so every such prop is named for its action plus `Label`.
