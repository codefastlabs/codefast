---
"@codefast/cli": minor
---

`codefast audit engines` now holds the workspace root's `engines.node` floor, when written `>=X.Y.Z`, to the
`engines.node` of every dependency any workspace package installs, runtime and dev alike, from the root floor up
(short-lived odd lines below `.node-version` aside). A gap is reported as `root-outside-dependency-engines`, once per
dependency range, naming the packages that install it. The root is still never listed among `floors` and is checked only
when the target reaches it.
