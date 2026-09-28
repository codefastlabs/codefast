// The line the spec prescribes for a runtime without `Symbol.metadata`, in a module the entry imports first.
(Symbol as { metadata?: symbol }).metadata ??= Symbol.for("Symbol.metadata");
