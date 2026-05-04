import { describe, expect, it } from "vitest";
import { createTagTestFilesystem } from "#/tests/support/tag-test-filesystem";
import { TagSinceWriter } from "#/tag/since-writer";

describe("TagSinceWriter", () => {
  it("does not emit a trailing space after * on blank JSDoc continuation lines", () => {
    const filePath = "/virtual/tag-since-blank-lines.ts";
    const initialSource = `/**
 * First paragraph.
 *
 * Second paragraph.
 */
export function taggedFn() {}
`;
    const tagTestFilesystem = createTagTestFilesystem({ path: filePath, content: initialSource });
    const writer = new TagSinceWriter(tagTestFilesystem.fs);
    writer.applySinceTagsToFile(filePath, "0.0.0-test", true);

    const written = tagTestFilesystem.getContent();
    const emptyContinuationWithTrailingSpace = /^\s+\* \s*$/m;
    expect(written).not.toMatch(emptyContinuationWithTrailingSpace);
    expect(written).toContain("* @since 0.0.0-test");
  });
});
