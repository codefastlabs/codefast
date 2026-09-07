import { Marker, MarkerContent } from "@codefast/ui/marker";

export function MarkerShimmer() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-8">
      <Marker role="status">
        <MarkerContent className="shimmer">Thinking…</MarkerContent>
      </Marker>
      <Marker role="status" variant="separator">
        <MarkerContent className="shimmer">Reading 4 files</MarkerContent>
      </Marker>
    </div>
  );
}
