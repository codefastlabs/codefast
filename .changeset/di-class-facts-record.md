---
"@codefast/di": patch
---

Resolving a class binding for the first time is cheaper. The metadata cache now keeps one record per class, which a cold
resolve looks up once instead of reading a separate map for each fact, and a class with no constructor parameters is
built without allocating an empty argument list. This mostly speeds up containers that bind and resolve many class
singletons at startup.
