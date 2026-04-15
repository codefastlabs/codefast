import { suggestCnGroupsForCli } from "#lib/arrange/application/use-cases/suggest-cn-groups.use-case";

describe("suggestCnGroupsForCli use case", () => {
  it("formats a cn() call on the happy path", () => {
    const outcome = suggestCnGroupsForCli({
      inlineClasses: "flex gap-2 p-4",
      emitTvStyleArray: false,
      trailingClassName: false,
    });
    expect(outcome.primaryLine).toContain("cn(");
    expect(outcome.bucketsCommentLine).toContain("// Buckets:");
  });

  it("emits tv-style array when requested", () => {
    const outcome = suggestCnGroupsForCli({
      inlineClasses: "flex gap-2",
      emitTvStyleArray: true,
      trailingClassName: false,
    });
    expect(outcome.primaryLine.trim().startsWith("[")).toBe(true);
  });

  it("appends trailing className slot when requested", () => {
    const outcome = suggestCnGroupsForCli({
      inlineClasses: "flex",
      emitTvStyleArray: false,
      trailingClassName: true,
    });
    expect(outcome.primaryLine).toContain("className");
  });
});
