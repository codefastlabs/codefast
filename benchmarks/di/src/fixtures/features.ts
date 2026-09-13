/**
 * The feature vocabulary every scenario's `requires` and every library's `features` are spelled in.
 *
 * A row requires the public-API features it cannot be written without; a library declares the ones
 * its public API offers. The listing reads one against the other, so a library missing a row is
 * either owed it (a gap) or cannot express it (unsupported), and the two never blur.
 */

/**
 * One line per feature, stating the public behaviour a library must offer to claim it.
 */
const DI_FEATURES = {
  transient: "a fresh instance on every resolve, through the whole dependency graph",
  "transient-root": "a fresh instance of the requested token over cached dependencies",
  optional: "an unbound token resolved optionally at the call site answers undefined instead of throwing",
  "optional-injection": "an unbound dependency declared optional at the injection site arrives as undefined",
  "name-hint": "a name qualifier at the call or injection site selects among several bindings on one token",
  "tag-hint": "a tag pair at the call site selects among several bindings on one token",
  "multi-tag": "several tags on one request, every one of which the winning binding must carry",
  "tagged-injection": "a consumer's own tag selects which binding its dependency resolves to",
  "contextual-constraint": "a binding's predicate over the requesting chain decides whether it applies",
  "resolve-all": "every binding on a token, returned as a collection",
  "async-resolve": "the container awaits async dependencies through the graph",
  "async-value": "a binding may produce a promise the caller awaits",
  "post-construct": "an initialisation hook the container runs after construction",
  "activation-hook": "a container-level hook that sees each resolved instance before it is handed out",
  "binding-activation-hook": "the same hook carried by one binding rather than the container",
  deactivation: "a teardown hook the container runs when a binding or container goes away",
  "child-container": "a child container resolving through its parent",
  scoped: "a lifetime shared within one child container, bound once in the parent",
  dispose: "one call tears down a container and the instances it owns",
  rebind: "a binding replaced in place by a later one for the same token",
  has: "asks whether a token is bound without resolving it",
  "has-own": "asks whether the container itself binds a token, ignoring its parents",
  module: "bindings grouped into a reusable unit a container is composed from",
  "module-unload": "a module's bindings removed again as one unit",
  alias: "a token forwarding to another token's binding",
  "class-injection": "a class the container constructs, its constructor dependencies injected",
  "explicit-deps": "a factory whose dependency tokens are declared, without decorators",
  "self-binding": "a class used as its own token",
  decorators: "constructor wiring declared through class decorators",
  "property-injection": "a dependency injected into a field rather than a constructor parameter",
  "cycle-detection": "a dependency cycle fails with a dedicated error rather than a stack overflow",
  "ambiguity-error": "a single resolve over several matching bindings fails rather than picking one",
  validate: "static validation of the bound graph without resolving it",
  introspection: "the bound graph read back as data: a snapshot, a lookup, a dependency graph",
  initialize: "eager construction of every singleton ahead of the first request",
} as const satisfies Record<string, string>;

/**
 * A feature a scenario may require and a library may declare.
 */
export type DiFeature = keyof typeof DI_FEATURES;
