/** The figure-free analysis a suite's RESULTS.md carries, typed by the competitor names its bench config declares. */

/** A scenario quoted against the named competitors, each cell rendered from the baseline. */
export interface QuotedRow<Name extends string = string> {
  readonly id: string;
  readonly versus: ReadonlyArray<Name>;
}

/** How a loss is judged: slower at the same work, more work by design, a price paid on purpose, the harness, or a mode. */
export type LossKind = "real deficit" | "work difference" | "chosen cost" | "harness state" | "process mode";

/**
 * One loss shape: the rows it explains and the reasoning, which states no figure.
 *
 * @remarks `losses` must still lose against each named competitor, or the page refuses to build; `context` rows are
 * quoted beside them without that check.
 */
export interface LossNote<Name extends string = string> {
  readonly title: string;
  readonly kinds: ReadonlyArray<LossKind>;
  readonly losses: ReadonlyArray<QuotedRow<Name>>;
  readonly context: ReadonlyArray<QuotedRow<Name>>;
  readonly body: string;
}

/** One of the measurements an application feels, described without its figures. */
export interface UserFacingNote<Name extends string = string> {
  readonly title: string;
  readonly lead: string;
  readonly rows: ReadonlyArray<QuotedRow<Name>>;
  readonly body: string;
}

/** Every note a baseline is checked against and the page renders. */
export interface ResultsNotes<Name extends string = string> {
  readonly userFacingNotes: ReadonlyArray<UserFacingNote<Name>>;
  /** The paragraph under the bundle table, which the footprint record cannot say. */
  readonly bundleNote: string;
  /** Every loss shape, ordered by how much it matters. */
  readonly lossNotes: ReadonlyArray<LossNote<Name>>;
}
