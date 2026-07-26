---
"@codefast/di": patch
---

Register a fluent binding chain once instead of once per refinement. `bind(T).toDynamic(f).singleton()` used to insert a binding, remove it, and insert a replacement — two registry mutations, two version bumps, and a full index churn per binding. The chain now registers on its `to*()` call and refines that same registered object in place; only `when*()` re-slots, and it re-registers under the chain's original id, so `id()` stays valid for the whole chain instead of the intermediate ids being dead. Binding construction also funnels through a single `createBinding()` literal, which is what guarantees the one V8 hidden class the resolver's hot property reads depend on — so the registry stores what it is handed rather than re-copying it.

Cold container build (build, bind 10 nodes, resolve the root) went from the suite's only loss to a win against every competitor: 0.76× → 3.0× of InversifyJS, 0.43× → 1.9× of Awilix, 0.22× → 1.07× of tsyringe.

The builder's `CommitFn` type is replaced by a `BindingCommitter` interface (`commit` plus `refine`, the latter for in-place refinements the registry indexes do not care about), and `createBinding` / `refinableFields` are new exports from `@codefast/di/binding`.
