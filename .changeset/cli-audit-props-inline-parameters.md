---
"@codefast/cli": minor
---

`codefast audit props` also reads a component's props parameter annotated inline with `&`: in a `.tsx` file, the first
parameter of any function whose annotation is an intersection at its top level, such as
`function ListItem({ href, ...props }: ComponentProps<"li"> & { href: string })`. The type server judges it like an
alias — a union, a type parameter or a non-object part keeps it — and a reported one asks to be named as an interface.
`audit.props.allowlist` takes the annotation's first line as written.
