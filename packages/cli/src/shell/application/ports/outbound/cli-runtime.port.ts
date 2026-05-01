export interface CliRuntimePort {
  cwd(): string;
  setExitCode(code: number): void;
  isStdoutTty(): boolean;
}
