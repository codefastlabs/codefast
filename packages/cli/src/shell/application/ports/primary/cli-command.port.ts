import type { CliLeafDispatchHandler } from "#/shell/application/ports/primary/cli-host.port";

/**
 * Ordered Commander wiring for a leaf (`argument` / `option` sequences).
 * Omit when the leaf resolves to a zero-argument/zero-option entrypoint.
 */
export type CliCommandRouteWire =
  | Readonly<{ kind: "optionalPositional"; argumentTemplate: string; helpBlurb: string }>
  | Readonly<{ kind: "greedyPositional"; argumentTemplate: string; helpBlurb: string }>
  | Readonly<{
      kind: "booleanFlag";
      flagPhrase: string;
      helpBlurb: string;
      whenUnsetUses: boolean;
    }>
  | Readonly<{
      kind: "stringPlaceholderFlag";
      flagPhraseWithPlaceholder: string;
      helpBlurb: string;
    }>
  | Readonly<{ kind: "synonymousBooleanAliases"; commaJoinedFlags: string; helpBlurb: string }>;

/** Declarative command tree consumed by `#/shell/infrastructure/commander/...`. */
export type CliCommandTree = Readonly<{
  name: string;
  description: string;
  action?: CliLeafDispatchHandler;
  children?: readonly CliCommandTree[];
  /** Passed to Commander `alias` before route wiring on this node. */
  aliases?: readonly string[];
  /** Applied in order before `action` is registered on a leaf. */
  route?: readonly CliCommandRouteWire[];
}>;

/** Primary facade: exposes a declarative Commander route tree built at runtime */
export interface CliCommandPort {
  readonly definition: CliCommandTree;
}
