---
"@codefast/di": patch
---

fix(di): reject a deps array longer than the constructor at compile time

The deps-checking changeset closed three of the four `@injectable` mismatches and documented the fourth as the one
TypeScript's arity rules let through: a class taking fewer parameters than `deps` declares satisfies a constructor type
taking more, so the surplus dependency compiled, resolved, and was discarded — a latent wiring bug nothing reported. The
deps overload now infers the class and requires `Deps["length"]` to be an arity the constructor declares, so the surplus
is a compile error at the decorator.

Exactly the arities the class admits stay legal: an optional trailing parameter contributes every length it declares
(the check is against the union), and a rest parameter admits any list. `@injectable()` and `@injectable([])` keep their
looser overload for classes that inject through accessors. The rejection and both admissions are pinned in
`tests/types/injection-contract.test.ts` beside the three mismatches already there.

The check only binds where the compiler knows the length: a deps **array** — built at runtime, length `number` — skips
it, which is also the deliberate spelling for declaring more dependencies than the constructor takes (the dependency
graph's edge declarations do exactly this). The first draft enforced arity on arrays too and was corrected by its own
first run: it rejected a legitimate mapped-token deps list and the intentional declare-more-than-you-take shape in the
benchmark suite.

A literal deps tuple that compiled against the old signature only did so by carrying a dependency the class could never
receive — fixing the declaration is deleting the surplus entry.
