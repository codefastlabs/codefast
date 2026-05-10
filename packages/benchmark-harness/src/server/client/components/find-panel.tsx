interface FindPanelProps {
  search: string;
  group: string;
  uniqueGroups: Array<string>;
  onSearchChange: (value: string) => void;
  onGroupChange: (value: string) => void;
}

export function FindPanel({
  search,
  group,
  uniqueGroups,
  onSearchChange,
  onGroupChange,
}: FindPanelProps) {
  return (
    <section aria-label="Find scenarios" className="bh-find-panel bh-glass bh-glass--tight">
      <h2 className="bh-section-title">Find scenarios</h2>
      <div className="bh-find-panel__row">
        <label className="bh-label-wrap--search">
          <span className="bh-field-label">Search</span>
          <input
            autoComplete="off"
            className="bh-focus bh-field bh-field--search"
            id="scenario-search"
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filter by scenario, group…"
            type="search"
            value={search}
          />
        </label>
        <label className="bh-label-wrap--group">
          <span className="bh-field-label">Group</span>
          <select
            aria-label="Filter by group"
            className="bh-focus bh-field bh-field--group"
            onChange={(e) => onGroupChange(e.target.value)}
            value={group}
          >
            <option value="">All groups</option>
            {uniqueGroups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
