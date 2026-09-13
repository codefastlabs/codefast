---
"@codefast/di": patch
---

Construct an accessor-injected class without the two per-instantiation allocations it used to pay: the ambient
resolution handed to its accessors is built once per resolver for the lent root stack, and the construction itself runs
inside the ambient scope directly instead of through a wrapping closure.
