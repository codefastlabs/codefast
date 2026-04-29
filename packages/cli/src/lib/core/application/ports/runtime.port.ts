export interface CliRuntime {
  cwd(): string;
  setExitCode(code: number): void;
  isStdoutTty(): boolean;
}
