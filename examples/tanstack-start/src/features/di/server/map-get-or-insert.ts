// Map.prototype.getOrInsert / getOrInsertComputed ship in V8 after Node 24; @codefast/di calls the
// computed form, so patch both before the container runs on Vercel's nodejs24.x runtime. Native on
// Node 25+, where this is a no-op.
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

if (!("getOrInsertComputed" in Map.prototype)) {
  Object.defineProperty(Map.prototype, "getOrInsertComputed", {
    configurable: true,
    writable: true,
    value(this: Map<unknown, unknown>, key: unknown, callback: (key: unknown) => unknown): unknown {
      if (this.has(key)) {
        return this.get(key);
      }

      const computed = callback(key);

      this.set(key, computed);

      return computed;
    },
  });
}
