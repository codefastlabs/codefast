import { TSDocConfiguration, TSDocParser, TSDocTagDefinition, TSDocTagSyntaxKind } from "@microsoft/tsdoc";

/**
 * Validates every doc block against the official TSDoc grammar, not a regex approximation.
 */

/**
 * One grammar diagnostic from the TSDoc parser.
 *
 * @since 0.6.0
 */
export interface TsdocSyntaxFinding {
  readonly line: number;
  /** The parser's stable message id, e.g. `tsdoc-escape-right-brace` — the allowlist key. */
  readonly raw: string;
  readonly reason: string;
}

const configuration = new TSDocConfiguration();
// The repo's one custom tag, stamped at release by `codefast tag`.
configuration.addTagDefinition(new TSDocTagDefinition({ tagName: "@since", syntaxKind: TSDocTagSyntaxKind.BlockTag }));
configuration.setSupportForTags(configuration.tagDefinitions, true);
const parser = new TSDocParser(configuration);

// Only a line-leading `/**` opens a doc block — one inside code or a string literal does not.
const docBlockPattern = /^[ \t]*\/\*\*[\s\S]*?\*\//gm;

/**
 * Every TSDoc grammar diagnostic in a file's doc blocks, in source order.
 *
 * @since 0.6.0
 */
export function scanTsdocSyntax(content: string): Array<TsdocSyntaxFinding> {
  const findings: Array<TsdocSyntaxFinding> = [];
  for (const match of content.matchAll(docBlockPattern)) {
    const context = parser.parseString(match[0]);
    if (context.log.messages.length === 0) {
      continue;
    }
    const blockLine = content.slice(0, match.index).split("\n").length;
    for (const message of context.log.messages) {
      const offsetInBlock = match[0].slice(0, message.textRange.pos).split("\n").length - 1;
      findings.push({
        line: blockLine + offsetInBlock,
        raw: message.messageId,
        reason: message.unformattedText,
      });
    }
  }
  return findings;
}
