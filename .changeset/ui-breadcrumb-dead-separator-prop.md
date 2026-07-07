---
"@codefast/ui": patch
---

Remove the dead `separator` prop from the `Breadcrumb` root — it was never consumed (a vestige of the old upstream shape) and only leaked onto the `<nav>` element as an invalid DOM attribute. Custom separators keep working the supported way: pass children to `<BreadcrumbSeparator>`.
