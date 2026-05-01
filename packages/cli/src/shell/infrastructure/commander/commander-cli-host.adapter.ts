import { Command, Option } from "commander";
import type {
  CliCommandRouteWire,
  CliCommandTree,
} from "#/shell/application/ports/primary/cli-command.port";
import type {
  CliGlobalOptionsBridgePort,
  CliLeafDispatchHandler,
} from "#/shell/application/ports/primary/cli-host.port";

/** Traverses {@link CliCommandTree} onto a Commander {@link Command} node. */
export class CommanderCliHostAdapter {
  constructor(private readonly rootProgram: Command) {}

  registerRoot(treeRoot: CliCommandTree): void {
    CommanderCliHostAdapter.attachSubtree(this.rootProgram, treeRoot);
  }

  /** Attaches every top-level CLI root command subtree under one program root. */
  static registerTrees(programRoot: Command, trees: readonly CliCommandTree[]): void {
    const adapter = new CommanderCliHostAdapter(programRoot);
    for (const subtree of trees) {
      adapter.registerRoot(subtree);
    }
  }

  private static isLikelyPlainOptionsRecord(
    candidate: unknown,
  ): candidate is Record<string, unknown> {
    return typeof candidate === "object" && candidate !== null && !Array.isArray(candidate);
  }

  private static extractDispatchParts(args: unknown[]): {
    positionalArguments: unknown[];
    localOptionRecord: Readonly<Record<string, unknown>>;
    commandLeaf: Command;
  } {
    if (args.length < 2) {
      throw new Error("[internal] Commander action invoked with too few arguments");
    }
    const commandLeafCandidate = args[args.length - 1];
    if (!(commandLeafCandidate instanceof Command)) {
      throw new Error("[internal] Commander action trailing argument must be Command");
    }
    const candidateOptions = args[args.length - 2];
    const positionalArguments =
      typeof candidateOptions !== "undefined" &&
      CommanderCliHostAdapter.isLikelyPlainOptionsRecord(candidateOptions)
        ? args.slice(0, -2)
        : args.slice(0, -1);
    const localOptionRecord = CommanderCliHostAdapter.isLikelyPlainOptionsRecord(candidateOptions)
      ? candidateOptions
      : {};
    return { positionalArguments, localOptionRecord, commandLeaf: commandLeafCandidate };
  }

  private static applyRouteWire(leafCommand: Command, wire: CliCommandRouteWire): Command {
    switch (wire.kind) {
      case "optionalPositional": {
        return leafCommand.argument(wire.argumentTemplate, wire.helpBlurb);
      }
      case "greedyPositional": {
        return leafCommand.argument(wire.argumentTemplate, wire.helpBlurb);
      }
      case "booleanFlag": {
        return leafCommand.option(wire.flagPhrase, wire.helpBlurb, wire.whenUnsetUses);
      }
      case "stringPlaceholderFlag": {
        return leafCommand.option(wire.flagPhraseWithPlaceholder, wire.helpBlurb);
      }
      case "synonymousBooleanAliases": {
        return leafCommand.addOption(
          new Option(wire.commaJoinedFlags, wire.helpBlurb).default(false),
        );
      }
    }
  }

  private static wireLeafDispatch(leafCommand: Command, dispatch: CliLeafDispatchHandler): void {
    void leafCommand.action(async (...passedArguments: unknown[]) => {
      const { positionalArguments, localOptionRecord, commandLeaf } =
        CommanderCliHostAdapter.extractDispatchParts(passedArguments);
      const globalBridge: CliGlobalOptionsBridgePort = {
        readMergedGlobalsOptionRecords: (): Readonly<Record<string, unknown>> => {
          const bridgeCommand = commandLeaf as Command & {
            optsWithGlobals?: () => Record<string, unknown>;
          };
          const mergedViaGlobalsBridge = bridgeCommand.optsWithGlobals?.();
          if (mergedViaGlobalsBridge) {
            return mergedViaGlobalsBridge;
          }
          return bridgeCommand.opts() as Record<string, unknown>;
        },
      };
      await dispatch(positionalArguments, localOptionRecord, globalBridge);
    });
  }

  private static attachSubtree(parentBridge: Command, node: CliCommandTree): void {
    let branchCommand = parentBridge.command(node.name).description(node.description);
    if (node.aliases !== undefined) {
      for (const aliasPiece of node.aliases) {
        branchCommand = branchCommand.alias(aliasPiece);
      }
    }

    const childBranchCount = node.children?.length ?? 0;
    const hasLeafDispatcher = typeof node.action !== "undefined";

    if (childBranchCount > 0 && hasLeafDispatcher) {
      throw new Error(
        `[cli] Command "${node.name}" cannot combine children with a leaf action dispatch`,
      );
    }

    if (childBranchCount > 0) {
      for (const nestedChild of node.children!) {
        CommanderCliHostAdapter.attachSubtree(branchCommand, nestedChild);
      }
      return;
    }

    if (hasLeafDispatcher) {
      let leafConfigured = branchCommand;
      const routePieces = node.route ?? [];
      for (const segment of routePieces) {
        leafConfigured = CommanderCliHostAdapter.applyRouteWire(leafConfigured, segment);
      }
      CommanderCliHostAdapter.wireLeafDispatch(leafConfigured, node.action);
      return;
    }

    /*
     * Routing-only stubs (composition tests) may omit both children and action;
     * Commander exposes an empty-named sub-command without behavior beyond help.
     */
  }
}
