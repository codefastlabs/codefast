import { Marker, MarkerContent, MarkerIcon } from "@codefast/ui/marker";
import { BookOpenCheckIcon, GitBranchIcon, SearchIcon } from "lucide-react";

export function MarkerIconExample() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-12">
      <Marker>
        <MarkerIcon>
          <GitBranchIcon />
        </MarkerIcon>
        <MarkerContent>Switched to a new branch</MarkerContent>
      </Marker>
      <Marker variant="separator">
        <MarkerIcon>
          <SearchIcon />
        </MarkerIcon>
        <MarkerContent>Explored 4 files</MarkerContent>
      </Marker>
      <Marker className="flex-col">
        <MarkerIcon>
          <BookOpenCheckIcon />
        </MarkerIcon>
        <MarkerContent>Syncing completed</MarkerContent>
      </Marker>
    </div>
  );
}
