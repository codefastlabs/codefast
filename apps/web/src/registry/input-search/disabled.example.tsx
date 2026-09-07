import { InputSearch } from "@codefast/ui/input-search";

export function InputSearchDisabled() {
  return (
    <div className="w-full max-w-xs">
      <InputSearch disabled defaultValue="Indexing…" placeholder="Search" />
    </div>
  );
}
