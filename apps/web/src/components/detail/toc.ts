export interface TocItem {
  readonly id: string;
  readonly label: string;
  /** 1 = top-level section, 2 = nested (e.g. an individual example). */
  readonly depth?: 1 | 2;
}
