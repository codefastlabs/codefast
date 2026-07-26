---
"@codefast/di": patch
---

Compile instantiation plans around dependencies the compiler cannot see through, instead of refusing to compile the graph at all. A factory, a scoped binding, an activation hook, a class past the depth limit, or a multi/optional/named parameter now compiles to an _escape_ — a re-entry into the runtime resolver seeded with exactly the ancestors the interpreted path would have pushed at that point, dispatched through exactly the resolve the interpreter would have called. Cycle detection, constraint contexts and error paths are therefore identical to never having compiled, and only the opaque dependency pays the runtime price while its siblings and ancestors stay compiled.

Previously a single `toDynamic` dependency anywhere in a class graph dropped the whole graph to the interpreted path — a 13.9× cliff on a shape applications write constantly (a factory-provided config injected into a class tree). That graph is now ~2× faster, and the first-materialization path of a singleton dependency inside a plan gained cycle detection it did not have.
