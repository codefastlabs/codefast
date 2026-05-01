export interface ArrangeTargetScannerPort {
  scanTarget(args: { readonly targetPath: string }): string[];
}
