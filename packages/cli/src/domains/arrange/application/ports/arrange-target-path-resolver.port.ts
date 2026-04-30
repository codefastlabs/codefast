export interface ArrangeTargetPathResolverPort {
  resolveTargetPath(args: {
    readonly currentWorkingDirectory: string;
    readonly rawTarget: string | undefined;
  }): string;
}
