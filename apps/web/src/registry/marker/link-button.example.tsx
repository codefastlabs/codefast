import { Marker, MarkerContent, MarkerIcon } from "@codefast/ui/marker";
import { toast } from "@codefast/ui/sonner";
import { GitBranchIcon, RotateCcwIcon } from "lucide-react";

export function MarkerLinkButton() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-8">
      <Marker asChild>
        <a href="#links-and-buttons">
          <MarkerIcon>
            <GitBranchIcon />
          </MarkerIcon>
          <MarkerContent>View the pull request</MarkerContent>
        </a>
      </Marker>
      <Marker asChild>
        <button
          className="transition-colors hover:text-foreground"
          type="button"
          onClick={() => {
            toast("You clicked the revert button");
          }}
        >
          <MarkerIcon>
            <RotateCcwIcon />
          </MarkerIcon>
          <MarkerContent>Revert this change</MarkerContent>
        </button>
      </Marker>
    </div>
  );
}
