/**
 * Driver-side host bridge: merged global CLI options from Commander (`optsWithGlobals`) for leaf handlers.
 * Part of the shell primary (inbound) boundary alongside {@link CliCommandPort}.
 */
export interface CliGlobalOptionsBridgePort {
  readMergedGlobalsOptionRecords(): Readonly<Record<string, unknown>>;
}

export type CliLeafDispatchHandler = (
  positionalArguments: readonly unknown[],
  localOptionRecord: Readonly<Record<string, unknown>>,
  globalBridge: CliGlobalOptionsBridgePort,
) => void | Promise<void>;
