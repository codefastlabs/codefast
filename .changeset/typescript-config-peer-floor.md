---
"@codefast/typescript-config": minor
---

pr: #965

The `typescript` peer range is now `>=7.0.0`, up from `>=5.0.0`: TypeScript 7 is the one compiler the presets are
checked against, so it is the floor they support. A project pinned to TypeScript 6 or older now fails npm's peer
resolution (`ERESOLVE`) and gets a pnpm peer warning. Move it to TypeScript 7, or stay on 0.9.x while its tooling still
needs TypeScript 6. A Next.js app on `next.json` needs Next.js 16.3 or later, the first release that type-checks with
TypeScript 7.
