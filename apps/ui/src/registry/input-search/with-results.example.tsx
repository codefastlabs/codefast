import { InputSearch } from "@codefast/ui/input-search";
import { useState } from "react";

const FRUITS = ["Apple", "Apricot", "Banana", "Blueberry", "Cherry", "Grape", "Mango", "Orange"];

export function InputSearchWithResults() {
  const [query, setQuery] = useState("");

  const matches = FRUITS.filter((fruit) => fruit.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="w-full max-w-xs space-y-2">
      <InputSearch placeholder="Filter fruit…" value={query} onChange={(value) => setQuery(value ?? "")} />
      <ul className="rounded-lg border border-ui-border">
        {matches.length > 0 ? (
          matches.map((fruit) => (
            <li key={fruit} className="border-b border-ui-border/60 px-3 py-1.5 text-sm text-ui-fg last:border-0">
              {fruit}
            </li>
          ))
        ) : (
          <li className="px-3 py-1.5 text-sm text-ui-muted">No matches</li>
        )}
      </ul>
    </div>
  );
}
