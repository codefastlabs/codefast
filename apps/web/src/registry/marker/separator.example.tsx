import { Marker, MarkerContent } from "@codefast/ui/marker";

export function MarkerSeparator() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-8">
      <Marker variant="separator">
        <MarkerContent>Today</MarkerContent>
      </Marker>
      <Marker variant="separator">
        <MarkerContent>Worked for 42s</MarkerContent>
      </Marker>
      <Marker variant="separator">
        <MarkerContent>Conversation compacted</MarkerContent>
      </Marker>
    </div>
  );
}
