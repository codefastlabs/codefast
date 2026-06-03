import { Alert, AlertAction, AlertDescription, AlertTitle } from "@codefast/ui/alert";
import { Button } from "@codefast/ui/button";
import { InfoIcon, TriangleAlertIcon, XIcon } from "lucide-react";

export function AlertVariants() {
  return (
    <div className="w-full max-w-sm space-y-3">
      <Alert>
        <InfoIcon />
        <AlertTitle>Heads up</AlertTitle>
        <AlertDescription>You can add components to your app using the CLI.</AlertDescription>
        <AlertAction>
          <Button aria-label="Dismiss" size="icon-xs" variant="ghost">
            <XIcon />
          </Button>
        </AlertAction>
      </Alert>
      <Alert variant="destructive">
        <TriangleAlertIcon />
        <AlertTitle>Session expired</AlertTitle>
        <AlertDescription>Please log in again to continue.</AlertDescription>
      </Alert>
    </div>
  );
}
