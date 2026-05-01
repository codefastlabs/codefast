export interface TagTargetPathResolverPort {
  resolveProvidedTargetPath(args: {
    readonly currentWorkingDirectory: string;
    readonly rawTarget: string | undefined;
  }): string | undefined;
}
