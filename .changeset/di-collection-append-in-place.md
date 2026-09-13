---
"@codefast/di": patch
---

Build collections in linear time. A token's binding list now appends in place and is replaced only on removal or
displacement, with every selection walk reading its starting length first, so a predicate that binds mid-walk is still
invisible to that walk; and a bare `when()` rewrites the binding's predicate in place — moving a lone binding into a
record — instead of re-registering it, whenever the chain owns the registry's last write and has nothing parked. A
hundred `when()` bindings on one token no longer copy the list a hundred times.
