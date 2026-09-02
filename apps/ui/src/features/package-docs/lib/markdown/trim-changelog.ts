/**
 * Keeps a changelog page readable: Changesets appends every release forever, so the oldest packages
 * carry hundreds of `## <version>` sections and half a megabyte of HTML. The page shows the latest
 * releases and points at the full file for the rest.
 */

/** How many releases a changelog page shows before deferring to the full file. */
export const CHANGELOG_RELEASES_SHOWN = 20;

export interface TrimmedChangelog {
  readonly source: string;
  /** Releases left out, so the page can say how many and link to the full history. */
  readonly omitted: number;
}

/** Cuts `source` after `keep` release sections (`## …` headings); the preamble before the first release stays. */
export function trimChangelog(source: string, keep: number = CHANGELOG_RELEASES_SHOWN): TrimmedChangelog {
  const releaseHeading = /^## /gm;
  const starts: Array<number> = [];

  for (const match of source.matchAll(releaseHeading)) {
    starts.push(match.index);
  }

  if (starts.length <= keep) {
    return { source, omitted: 0 };
  }

  const cutAt = starts[keep];

  return { source: source.slice(0, cutAt).trimEnd(), omitted: starts.length - keep };
}
