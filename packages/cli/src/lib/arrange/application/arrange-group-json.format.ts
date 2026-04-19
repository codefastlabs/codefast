export type ArrangeGroupJsonPayloadV1 = {
  readonly schemaVersion: 1;
  readonly primaryLine: string;
  readonly bucketsCommentLine: string;
};

export function formatArrangeGroupJsonOutput(output: {
  readonly primaryLine: string;
  readonly bucketsCommentLine: string;
}): string {
  const payload: ArrangeGroupJsonPayloadV1 = {
    schemaVersion: 1,
    primaryLine: output.primaryLine,
    bucketsCommentLine: output.bucketsCommentLine,
  };
  return JSON.stringify(payload);
}
