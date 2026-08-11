---
"@codefast/di": minor
---

New `toMermaidGraph` adapter (`@codefast/di/graph-adapters/mermaid`): renders a container graph as Mermaid
`flowchart TD` source — viewable anywhere Mermaid renders (GitHub markdown, docs tooling, mermaid.live) with no extra
library. Parent-chain nodes and unbound-optional placeholders carry dashed `classDef`s; `toDotGraph` now also dashes
unbound placeholders, not just parent nodes.
