---
"@codefast/di": minor
---

Four size thresholds are gone, each replaced by the algorithm it approximated: alias chains fold exactly to any length
(`ALIAS_HOP_LIMIT` is removed from `resolution/cache/binding-lookup-cache`); a generated plan is one statement per node
and inlines to any depth; every synchronous lane checks a cycle by the binding's in-flight flag at any depth
(`RESOLUTION_SET_THRESHOLD` and `enterResolutionPath` are removed from `resolution/path/resolution-path`); a
multi-criterion request is selected by one scan at any binding count. `PLAN_CODEGEN_THRESHOLD` is 1024, the measured
break-even of generating a plan against running its closure.
