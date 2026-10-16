---
"@codefast/typescript-config": minor
---

Add the `node22.json` and `node22-dom.json` overlays, which narrow `lib` and `target` to what Node 22 ships for a
package whose floor is on Node 22, and lower the package's own Node.js floor to 22.12.
