export const TAG_COLORS = {
  RESET: "\x1b[0m",
  RED: "\x1b[31m",
  GREEN: "\x1b[32m",
  YELLOW: "\x1b[33m",
} as const;

export function withTagColor(line: string, colorCode: string): string {
  return `${colorCode}${line}${TAG_COLORS.RESET}`;
}
