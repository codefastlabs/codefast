/** The full message text of every library error, which a production build swaps for its identifiers alone. */
import type { ConstraintRequirement } from "#core/constraint-requirement";
import type { BindingTag } from "#core/tag";
import { slotName } from "#core/tag";
import type { BindingIdentifier, BindingScope, ResolveOptions } from "#core/types";

// A path of one token only repeats the name the message already opens with.
function pathSuffix(path: ReadonlyArray<string>): string {
  return path.length > 1 ? ` Path: ${path.join(" → ")}` : "";
}

// Options carry caller values a tag may hold — a bigint or a circular object must not make the
// diagnostic itself throw and mask the real error. The reserved criterion renders as `name`.
function describeResolveOptions(options: ResolveOptions): string {
  try {
    let name = options.name;
    const criteria: Array<string> = [];
    const add = (criterion: BindingTag): void => {
      if (criterion.key === slotName) {
        name ??= String(criterion.value);
      } else {
        criteria.push(`${criterion.key.name}=${String(criterion.value)}`);
      }
    };
    if (options.tag !== undefined) {
      add(options.tag);
    }
    if (options.tags !== undefined) {
      for (const criterion of options.tags) {
        add(criterion);
      }
    }
    const display: { name?: string; tags?: Array<string> } = {};
    if (name !== undefined) {
      display.name = name;
    }
    if (criteria.length > 0) {
      display.tags = criteria;
    }
    return JSON.stringify(display) ?? "undefined";
  } catch {
    return "[unserializable options]";
  }
}

/** The message of a `TokenNotBoundError`. */
export function tokenNotBound(tokenName: string, path: ReadonlyArray<string>): string {
  return `No binding found for token '${tokenName}'. Did you forget container.bind(${tokenName})?${pathSuffix(path)}`;
}

/** The message of a `NoMatchingBindingError`. */
export function noMatchingBinding(
  tokenName: string,
  options: ResolveOptions,
  availableSlots: ReadonlyArray<string>,
  path: ReadonlyArray<string>,
): string {
  return `No binding for '${tokenName}' matching ${describeResolveOptions(options)}. Available slots: [${availableSlots.join(", ")}].${pathSuffix(path)}`;
}

/** The message of an `AmbiguousBindingError`. */
export function ambiguousBinding(tokenName: string, candidateIds: ReadonlyArray<BindingIdentifier>): string {
  return `Multiple bindings for '${tokenName}' matched without a clear winner. Candidates: [${candidateIds.join(", ")}]. Ensure when() predicates are mutually exclusive.`;
}

/** The message of a `CircularDependencyError`. */
export function circularDependency(cycle: ReadonlyArray<string>): string {
  return `Circular dependency detected: ${cycle.join(" → ")}`;
}

/** The message of an `AsyncResolutionError`. */
export function asyncResolution(tokenName: string, asyncSourceToken: string): string {
  return asyncSourceToken === tokenName
    ? `Token '${tokenName}' requires async resolution because its factory is async. Use container.resolveAsync(${tokenName}).`
    : `Token '${tokenName}' requires async resolution because '${asyncSourceToken}' in its dependency chain has an async factory. Use container.resolveAsync(${tokenName}).`;
}

/** The message of an `AsyncDeactivationError`. */
export function asyncDeactivation(tokenName: string): string {
  return `Token '${tokenName}' has an async onDeactivation handler. Use unbindAsync() instead.`;
}

/** The message of a `ScopeViolationError`. */
export function scopeViolation(
  consumerToken: string,
  consumerScope: BindingScope,
  dependencyToken: string,
  dependencyScope: BindingScope,
  path: ReadonlyArray<string>,
): string {
  return `Scope violation: '${consumerToken}' (${consumerScope}) depends on '${dependencyToken}' (${dependencyScope}). Path: ${path.join(" → ")}`;
}

/** The message of an `EmptyTagCriteriaError`. */
export function emptyTagCriteria(helperName: string): string {
  return `${helperName}() was given no criteria. An empty list matches any ancestor, which is not what the call says — pass the criteria to require, or drop the constraint if there are none.`;
}

/** The message of an `UnreachableConstraintError`. */
export function unreachableConstraint(tokenName: string, requirement: ConstraintRequirement): string {
  const { name, helperName, tokenName: requiredTokenName } = requirement;
  const scope = requiredTokenName === undefined ? "no binding" : `no binding for '${requiredTokenName}'`;
  const target = requiredTokenName === undefined ? "the binding it should match" : `a '${requiredTokenName}' binding`;
  return `The binding for '${tokenName}' is constrained by ${helperName} waiting on the slot name '${name}', but ${scope} in this container or its ancestors declares it, so the constraint can never hold. Name the slot with .whenNamed('${name}') on ${target}, or correct the name here.`;
}

/** The message of an `UnreachableLifecycleHookError`. */
export function unreachableLifecycleHook(
  tokenName: string,
  phase: "onActivation" | "onDeactivation",
  reason: "unbound" | "no-deactivatable-binding",
): string {
  return reason === "unbound"
    ? `${phase}() is registered for '${tokenName}', which nothing is bound to in this container or its ancestors, so the hook can never run. Bind the token, or — if '${tokenName}' is a class you bound as an implementation via .to(${tokenName}) — register the hook against the token you bound instead.`
    : `${phase}() is registered for '${tokenName}', whose every binding in this container and its ancestors is transient, so the hook can never run: a transient instance is never deactivated. Make one of its bindings a singleton or scoped, or drop the hook.`;
}

/** The message of an `InvalidMetadataError`. */
export function invalidMetadata(targetName: string, reason: string): string {
  return `MetadataReader returned invalid metadata for class '${targetName}': ${reason}. Check the reader bound to MetadataReaderToken or passed to Container.create().`;
}

/** The message of a `MissingMetadataError`. */
export function missingMetadata(
  targetName: string,
  inheritedFrom: { readonly baseName: string; readonly dependencyCount: number } | undefined,
): string {
  return inheritedFrom === undefined
    ? `Class '${targetName}' is missing @injectable() decorator. Add @injectable([...deps]) or use toDynamic()/toResolved() instead.`
    : `Class '${targetName}' inherits ${String(inheritedFrom.dependencyCount)} declared constructor ${inheritedFrom.dependencyCount === 1 ? "dependency" : "dependencies"} from '${inheritedFrom.baseName}' but declares none of its own. Add @injectable([...deps]) to '${targetName}' — @injectable([]) if it takes none — or bind it with toDynamic()/toResolved().`;
}

/** The message of an `AsyncModuleLoadError`. */
export function asyncModuleLoad(moduleName: string): string {
  return `Module '${moduleName}' is async. Use container.loadAsync() instead.`;
}

/** The message of a `MissingScopeContextError`. */
export function missingScopeContext(tokenName: string): string {
  return `Token '${tokenName}' is scoped but was resolved from a container without a child scope context. Use container.createChild() to create a scoped context.`;
}

/** The message of a `MissingContainerContextError`. */
export function missingContainerContext(className: string | undefined, accessorName: string | symbol): string {
  const accessor = `@inject accessor '${String(accessorName)}'`;
  return className === undefined
    ? `An ${accessor} was initialized outside a container context. Resolve its class through a container, or open a synchronous context with runWithContainer() (the context does not survive an await).`
    : `Class '${className}' has an ${accessor} but was constructed outside a container context. Resolve it via container.resolve(${className}), or open a synchronous context with runWithContainer() (the context does not survive an await).`;
}

/** The message of a `ChainAlreadyRegisteredError`. */
export function chainAlreadyRegistered(tokenName: string): string {
  return `The binding for token '${tokenName}' is already registered on this chain, so its slot is final. Declare when*() and many() before to*(), or call bind() again to register another binding for the token.`;
}

/** The message of a `ManyBindingSlotError`. */
export function manyBindingSlot(tokenName: string): string {
  return `A many() binding for token '${tokenName}' keeps the default slot: it cannot also declare whenNamed() or whenTagged().`;
}

/** The message of a `ChainNotRegisteredError`. */
export function chainNotRegistered(tokenName: string): string {
  return `Cannot refine the binding for token '${tokenName}' before choosing a target. Call a to*() method first — for example .to(SomeClass), .toConstantValue(value) or .toDynamic(factory).`;
}

/** The message of a `RebindUnboundTokenError`. */
export function rebindUnboundToken(tokenName: string): string {
  return `Cannot rebind token '${tokenName}' because it has no own binding in this container. Use container.bind(${tokenName}) to create a new binding instead.`;
}

/** The message of a `SelfBindingRequiresClassError`. */
export function selfBindingRequiresClass(tokenName: string): string {
  return `toSelf() needs the token to be the class it constructs, and '${tokenName}' is not a class. Use .to(SomeClass) to name the implementation, or bind the class itself with container.bind(SomeClass).toSelf().`;
}

/** The message of a `StaticMemberDecoratorError`. */
export function staticMemberDecorator(decoratorName: string, memberName: string): string {
  return `@${decoratorName}() applies to instance members only, and '${memberName}' is static. Move it to an instance member, or read the value from the container where the static member is used.`;
}

/** The message of a `SymbolKeyedLifecycleError`. */
export function symbolKeyedLifecycle(decoratorName: string, memberName: string): string {
  return `@${decoratorName}() does not support a symbol-keyed method ('${memberName}'). Give the lifecycle method a string name.`;
}

/** The message of a `PrivateLifecycleMethodError`. */
export function privateLifecycleMethod(decoratorName: string, memberName: string): string {
  return `@${decoratorName}() does not support a private method ('${memberName}'). Make the lifecycle method public, and call the private code from it.`;
}

/** The message of a `MissingDecoratorMetadataError`. */
export function missingDecoratorMetadata(decoratorName: string): string {
  return `@${decoratorName}() received no decorator metadata: this runtime has no Symbol.metadata. Install it before any decorated class is defined, e.g. in a module imported first: (Symbol as { metadata?: symbol }).metadata ??= Symbol.for("Symbol.metadata");`;
}

/** The message of an `InvalidBindingDeclarationError`. */
export function invalidBindingDeclaration(tokenName: string, reason: string): string {
  return `Invalid binding declaration for '${tokenName}': ${reason}.`;
}

/** The message of a `DisposedContainerError`. */
export function disposedContainer(): string {
  return "Cannot perform operations on a disposed container.";
}

/** The message of an `AsyncActivationError`. */
export function asyncActivation(
  tokenName: string,
  hookKind: "postConstruct" | "onActivation",
  methodName: string | undefined,
): string {
  const detail =
    hookKind === "postConstruct"
      ? `@postConstruct method '${methodName ?? ""}' returned a Promise`
      : `onActivation for '${tokenName}' returned a Promise`;
  return `${detail}. Use resolveAsync() instead.`;
}

/** The text each metadata shape check names what it expected by. */
const METADATA_SHAPES = {
  object: "an object",
  array: "an array",
  string: "a string",
  token: "a token or a class",
  key: "a string or symbol",
} as const;

/**
 * The `reason` of an `InvalidMetadataError` raised by a shape check on a reader's answer.
 *
 * @remarks The subject is the path inside the answer that failed, or empty for the answer itself.
 */
export function invalidMetadataShape(
  section: "constructor" | "lifecycle" | "accessor",
  subject: string,
  expected: keyof typeof METADATA_SHAPES,
  received?: string,
): string {
  const shape = METADATA_SHAPES[expected];
  return subject === ""
    ? `${section} metadata: expected ${shape}${received === undefined ? "" : `, received ${received}`}`
    : `${section} metadata: ${subject} is not ${shape}`;
}

/** The `reason` of an `InvalidMetadataError` for a lifecycle method the instance does not have. */
export function lifecycleMethodMissing(methodName: string): string {
  return `lifecycle method '${methodName}' is not a method on the instance`;
}

/** The message of the `AggregateError` an operation throws when several deactivation hooks threw. */
export function deactivationHooksThrew(operation: "unbind" | "dispose()"): string {
  return `${operation} completed, but deactivation hooks threw`;
}

/** The message of the `AggregateError` a failed module load throws when its rollback threw too. */
export function moduleRollbackThrew(): string {
  return "module load failed, and rolling it back threw too";
}

/** The message of the `TypeError` a container function throws for an object `Container.create()` did not make. */
export function foreignContainer(): string {
  return "Expected a container created by Container.create().";
}
