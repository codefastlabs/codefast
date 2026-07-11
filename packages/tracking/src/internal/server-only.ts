// Mapped over server-only subpaths via the package.json "browser" condition — a client
// bundle that reaches this module fails loudly at build/import time instead of silently
// shipping server code (or a GA4 apiSecret) to the browser.
throw new Error(
  "@codefast/tracking: this subpath is server-only — import it from server functions, middleware, or route handlers, never from client code.",
);

export {};
