---
"@codefast/di": minor
---

A default-slot alias is a transparent pointer: a request whose criteria no slot of the alias's own token matches is
forwarded, criteria and all, to its target — `resolve(AbstractLogger, { name: "file" })` reaches `Logger`'s `"file"`
binding. An exact slot on the alias's token still wins, the nearest container still answers first, and `has` agrees;
`resolveAll` keeps filtering by the alias token's own slots.
