---
"@codefast/di": patch
---

`inspect` and `lookupBindings` read the container's inspector directly instead of building an internals object and the
ancestor-registry list on every call, so they cost what the methods did before they became functions. A paired run
against the method-shaped build reads `lookup-bindings` at −2% and `inspect-snapshot` at −4%, from −13% and −9%.
