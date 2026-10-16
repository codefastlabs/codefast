---
"@codefast/ui": patch
---

Component props that add their own members or join a variants type are declared as interfaces instead of `&`
intersections — `ButtonProps`, `CardProps`, `FieldProps`, `ScrollAreaProps` and the other 24 — so a prop that clashes
with the element's own now fails where it is declared rather than narrowing to `never`. Each accepts exactly the props
it did, with one exception: `ChartLegendContentProps` takes Recharts' legend-content type for every member the two
share, where the intersection demanded a value that satisfied both a `div` handler and a Recharts one, so it now accepts
more. `CalendarProps`, `ToggleGroupProps` and the internal `ScopedProps` helpers stay intersections, because their base
is a union or a type parameter.
