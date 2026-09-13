# fake-suite

A stand-in benchmark package for the parent's integration tests, not source code. The harness spawns a child as
`<packageRoot>/src/<entry>` with the package root as its working directory, which is the layout every real suite has
(`benchmarks/di/src/codefast-benches.ts`), so the fixture keeps that shape: this directory is the package root and
[`src/fake-benches.ts`](./src/fake-benches.ts) is its one entry.

The child speaks the parent's protocol and nothing else — the stderr progress lines, the framed JSON payload on stdout,
the exit codes — and takes its behaviour from `FAKE_*` environment keys, so one script covers every path the parent has
to handle. The test launches it with `process.execPath` directly and Node strips the types itself, so the run needs no
tsx, no pnpm and no tsconfig. `knip.json` ignores this directory because nothing imports the entry; it is reached by
path.
