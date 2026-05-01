/** Bridge passed into leaf handlers for global options merged by Commander (`optsWithGlobals`). */
export interface CliGlobalOptionsBridge {
  readMergedGlobalsOptionRecords(): Readonly<Record<string, unknown>>;
}

export type CliLeafDispatchHandler = (
  positionalArguments: readonly unknown[],
  localOptionRecord: Readonly<Record<string, unknown>>,
  globalBridge: CliGlobalOptionsBridge,
) => void | Promise<void>;
