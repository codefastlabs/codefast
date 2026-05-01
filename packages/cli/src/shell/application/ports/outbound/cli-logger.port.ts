export interface CliLoggerPort {
  out(line: string): void;
  err(line: string): void;
}
