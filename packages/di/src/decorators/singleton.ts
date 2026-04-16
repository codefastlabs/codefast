import { DiError } from "#errors";
import { CODEFAST_DI_CLASS_SCOPE_HINT, type ClassScopeHint } from "#decorators/metadata";

/**
 * Stage 3 class decorator: records a **hint** that this class prefers singleton scope.
 * The container may still override via explicit `.transient()` / `.scoped()` when binding.
 */
export function singleton(): <Class extends abstract new (...args: never[]) => unknown>(
  ctor: Class,
  context: ClassDecoratorContext<Class>,
) => void {
  return (ctor, context) => {
    const metadataRecord = context.metadata as Record<PropertyKey, unknown>;
    const prior = metadataRecord[CODEFAST_DI_CLASS_SCOPE_HINT];
    if (prior !== undefined && prior !== "singleton") {
      throw new DiError(
        `Conflicting class scope hints on "${String(context.name ?? ctor.name)}": cannot apply @singleton() after @scoped().`,
      );
    }
    metadataRecord[CODEFAST_DI_CLASS_SCOPE_HINT] = "singleton" satisfies ClassScopeHint;
  };
}
