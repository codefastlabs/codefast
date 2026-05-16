interface FindPanelProps {
  search: string;
  group: string;
  uniqueGroups: Array<string>;
  onSearchChange: (value: string) => void;
  onGroupChange: (value: string) => void;
}

/**
 * @since 0.3.16-canary.1
 */
export function FindPanel({
  search,
  group,
  uniqueGroups,
  onSearchChange,
  onGroupChange,
}: FindPanelProps) {
  return (
    <section
      aria-label="Find scenarios"
      className="border-bh-border bg-bh-surface mt-8 rounded-2xl border px-4 py-4 shadow-(--shadow-bh-glass-tight) backdrop-blur-xl backdrop-saturate-180 sm:mt-10 sm:px-6 sm:py-5"
    >
      <h2 className="text-bh-label text-[0.65rem] font-semibold tracking-[0.14em] uppercase">
        Find scenarios
      </h2>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:gap-x-6 sm:gap-y-4">
        <label className="block w-full min-w-0 shrink-0 sm:w-auto sm:min-w-[min(100%,16rem)]">
          <span className="mb-1.5 block text-[0.8125rem] font-medium text-zinc-400">Search</span>
          <input
            autoComplete="off"
            className="focus:border-bh-blue focus:ring-bh-blue/35 focus-visible:outline-bh-blue w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 shadow-(--shadow-bh-field-inset) placeholder:text-zinc-500 focus:ring-2 focus:outline-none focus-visible:outline focus-visible:outline-offset-2 sm:max-w-xs"
            id="scenario-search"
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filter by scenario, group…"
            type="search"
            value={search}
          />
        </label>
        <label className="block w-full shrink-0 sm:w-auto">
          <span className="mb-1.5 block text-[0.8125rem] font-medium text-zinc-400">Group</span>
          <select
            aria-label="Filter by group"
            className="focus:border-bh-blue focus:ring-bh-blue/35 focus-visible:outline-bh-blue w-full min-w-0 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 shadow-(--shadow-bh-field-inset) placeholder:text-zinc-500 focus:ring-2 focus:outline-none focus-visible:outline focus-visible:outline-offset-2 sm:w-auto sm:min-w-42"
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
