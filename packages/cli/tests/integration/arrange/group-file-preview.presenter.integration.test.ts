import { PresentGroupFilePreviewPresenter } from "#/domains/arrange/presentation/presenters/group-file-preview.presenter";

describe("PresentGroupFilePreviewPresenter integration", () => {
  it("prints unwrap and grouped preview sections", () => {
    const logger = { out: vi.fn(), err: vi.fn() };
    const presenter = new PresentGroupFilePreviewPresenter(logger);
    const callWithReplacement = { pos: 0, end: 8, arguments: [{}, {}] };
    const skippedCall = { pos: 10, end: 18, arguments: [] };

    presenter.printGroupFilePreviewFromWork({
      filePath: "src/example.tsx",
      sourceText: 'cn("a", "b")\ncn()',
      textAfterUnwrap: '"a"',
      domainSfForLineNumbers: { text: 'cn("a", "b")\ncn()' },
      domainSfGrouped: { text: '"a"' },
      cnInTvCalls: [callWithReplacement, skippedCall],
      unwrapReplacementByCall: new Map([[callWithReplacement, '"a", "b"']]),
      unwrapEdits: [{ start: 0, end: 8, replacement: '"a", "b"', call: callWithReplacement }],
      plannedGroupEdits: [
        {
          start: 0,
          end: 3,
          replacement: 'cn("flex", "gap-2")',
          bucketSummary: ["layout", "spacing"],
          jsxCn: false,
          lineSf: { text: 'cn("a")' },
          reportNode: { pos: 0 },
          label: "cn",
        },
      ],
      cnInTvNoReplacement: 1,
      reportTotal: 2,
      editSitesCount: 2,
    } as never);

    expect(logger.out).toHaveBeenCalledWith(expect.stringContaining("site(s)"));
    expect(logger.out).toHaveBeenCalledWith(expect.stringContaining("left unchanged"));
    expect(logger.out).toHaveBeenCalledWith(expect.stringContaining("[tv ⊃ cn → string/array]"));
    expect(logger.out).toHaveBeenCalledWith(
      expect.stringContaining("[tv ⊃ cn]: cn(...) has no arguments"),
    );
    expect(logger.out).toHaveBeenCalledWith(expect.stringContaining("// Buckets:"));
  });
});
