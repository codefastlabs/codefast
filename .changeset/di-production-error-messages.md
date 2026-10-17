---
"@codefast/di": minor
---

A production build ships short error messages. Under the `production` condition (`vite build`, webpack in production
mode), `#error-messages` resolves to a module whose messages keep only the identifiers they name — the path of a miss,
the cycle, the token, the class and member — so `TokenNotBoundError: app:Service → app:Logger` replaces the sentence.
Node, tsx, a development server and any bundler without that condition keep the full text. Every error's class, `name`,
`code` and context fields are the same in both, so branch on `code` rather than the message. The minimal program
(`Container`, `token`, bind a constant, resolve) drops from 20 152 B to 19 145 B gzipped in a production build.
