import { InputSearch } from "@codefast/ui/input-search";
import { useState } from "react";

export function InputSearchControlled() {
  const [query, setQuery] = useState("");

  return (
    <div className="w-full max-w-xs space-y-3">
      <InputSearch placeholder="Search components…" value={query} onChange={(value) => setQuery(value ?? "")} />
      <p className="text-center text-xs text-ui-muted">
        {query ? (
          <>
            Searching for <span className="font-medium text-ui-fg">“{query}”</span>
          </>
        ) : (
          "Type to search — the × clears the field"
        )}
      </p>
    </div>
  );
}
