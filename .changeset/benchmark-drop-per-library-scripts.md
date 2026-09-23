---
"@benchmark/di": minor
"@benchmark/tailwind-variants": minor
---

Drop the per-library `bench:<library>` scripts. The parent already spawns every library's child itself, and a child run
by hand gave up the interleaving, trials and diff that make a number worth reading. `BENCH_LIBRARY` narrows a real run
to the libraries named instead, and the dist-swap escape hatch spells the child's own command.
