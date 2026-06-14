import { Alert, AlertAction, AlertDescription, AlertTitle } from "@codefast/ui/alert";
import { Button } from "@codefast/ui/button";

export function AlertActionExample() {
  return (
    <Alert className="max-w-md">
      <AlertTitle>Dark mode is now available</AlertTitle>
      <AlertDescription>Enable it under your profile settings to get started.</AlertDescription>
      <AlertAction>
        <Button size="xs" variant="default">
          Enable
        </Button>
      </AlertAction>
    </Alert>
  );
}
