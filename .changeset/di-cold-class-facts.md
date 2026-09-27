---
"@codefast/di": patch
---

The first resolve of a class binding is cheaper. The class's parameter list, and the check that a subclass is not
dropping its base's declared dependencies, are settled once per class instead of once per instantiation, and the class
asked about last is answered without a map lookup, so a hundred singletons of one class bind and materialize about a
fifth faster.
