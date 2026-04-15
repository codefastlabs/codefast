export type CliPath = {
  resolve(...paths: string[]): string;
  join(...paths: string[]): string;
  relative(from: string, to: string): string;
  dirname(pathValue: string): string;
  basename(pathValue: string): string;
  extname(pathValue: string): string;
  readonly separator: string;
};
