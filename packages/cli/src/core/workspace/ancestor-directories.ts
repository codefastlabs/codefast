import path from "node:path";

/**
 * Each directory from `fromDirectory` up to and including the filesystem root.
 */
export function* ancestorDirectories(fromDirectory: string): Generator<string> {
  let directoryPath = path.resolve(fromDirectory);
  for (;;) {
    yield directoryPath;
    const parent = path.dirname(directoryPath);
    if (parent === directoryPath) {
      return;
    }
    directoryPath = parent;
  }
}

/**
 * The nearest ancestor directory (starting at `fromDirectory`) the predicate accepts, or undefined at the filesystem root.
 */
export function findNearestAncestor(
  fromDirectory: string,
  isMatch: (directoryPath: string) => boolean,
): string | undefined {
  for (const directoryPath of ancestorDirectories(fromDirectory)) {
    if (isMatch(directoryPath)) {
      return directoryPath;
    }
  }
  return undefined;
}
