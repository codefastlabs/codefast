import { getCommitInfo } from "@changesets/get-github-info";

// Metadata lines a summary may carry: `pr:` and `commit:` override the pull request lookup, `author:` is dropped.
const PULL_LINE = /^\s*(?:pr|pull|pull\s+request):\s*#?(\d+)/im;
const COMMIT_LINE = /^\s*commit:\s*(\S+)/im;
const AUTHOR_LINES = /^\s*(?:author|user):\s*@?\S+/gim;
// A bare `#123`, skipping any text already inside a Markdown link.
const ISSUE_REF = /\[.*?\]\(.*?\)|\B#([1-9]\d*)\b/g;

/** Resolves the number of the pull request a changeset landed in, or `undefined` when GitHub knows none. */
async function getPullNumber(repo, pull, commit) {
  if (pull !== undefined || commit === undefined) {
    return pull;
  }

  return (await getCommitInfo({ commit, repo }))?.pull?.number;
}

/** The changelog generator: a changeset's pull request link and summary, and dependency updates by version alone. */
const changelog = {
  async getReleaseLine(changeset, _type, options) {
    const repo = options?.repo;

    if (!repo) {
      throw new Error('Pass the repository to the changelog generator: ["./changelog.js", { "repo": "owner/name" }].');
    }

    let pull;
    let commit = changeset.commit;
    const [firstLine, ...continuation] = changeset.summary
      .replace(PULL_LINE, (_line, number) => {
        pull = Number(number);

        return "";
      })
      .replace(COMMIT_LINE, (_line, sha) => {
        commit = sha;

        return "";
      })
      .replace(AUTHOR_LINES, "")
      .trim()
      .split("\n")
      .map((line) =>
        line
          .trimEnd()
          .replace(ISSUE_REF, (match, issue) =>
            issue ? `[#${issue}](https://github.com/${repo}/issues/${issue})` : match,
          ),
      );
    const number = await getPullNumber(repo, pull, commit);
    const link = number === undefined ? "" : `[#${number}](https://github.com/${repo}/pull/${number}) `;

    return `\n\n- ${link}${firstLine}\n${continuation.map((line) => `  ${line}`).join("\n")}`;
  },
  getDependencyReleaseLine(_changesets, dependenciesUpdated) {
    if (dependenciesUpdated.length === 0) {
      return "";
    }

    return [
      "- Updated dependencies:",
      ...dependenciesUpdated.map(({ name, newVersion }) => `  - ${name}@${newVersion}`),
    ].join("\n");
  },
};

export default changelog;
