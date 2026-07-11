// Map.prototype.getOrInsert ships in V8 after Node 24; @codefast/di calls it, so patch it before
// the container runs on Vercel's nodejs24.x runtime. Native on Node 25+, where this is a no-op.
if (!("getOrInsert" in Map.prototype)) {
  Object.defineProperty(Map.prototype, "getOrInsert", {
    configurable: true,
    writable: true,
    value(this: Map<unknown, unknown>, key: unknown, value: unknown): unknown {
      if (this.has(key)) {
        return this.get(key);
      }

      this.set(key, value);

      return value;
    },
  });
}
