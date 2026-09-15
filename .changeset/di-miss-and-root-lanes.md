---
"@codefast/di": patch
---

Price the two lanes the full pass showed paying for the rewrite: a request for an unbound or record-less token reads the
record map alone once its lone-map probe has missed, instead of probing the lone map again, and a root container's
chain-summed versions are read as its own version instead of through the epoch memo, so a `resolveAll` over a root no
longer pays a compare and a stamp per candidate.
