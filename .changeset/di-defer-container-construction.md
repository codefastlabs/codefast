---
"@codefast/di": patch
---

Defer every per-container allocation a resolve can happen without. The resolver builds its plan compiler and plan maps
on the first plan request, the lookup cache allocates its memo maps only once a second distinct token or tag appears in
one cache generation, the activation-need memo is allocated by the first answer its early returns cannot give, and the
registry allocates its record map on the first bind. A per-request child that is created, asked one parent-owned token
and disposed now allocates none of them; the registry's fast-default map stays eager so the first read of every
synchronous resolve is still a bare `Map.get`.
