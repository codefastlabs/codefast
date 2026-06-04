import { Alert, AlertAction, AlertDescription, AlertTitle } from "@codefast/ui/alert";
import { Button } from "@codefast/ui/button";
import { SparklesIcon } from "lucide-react";

export function AlertWithAction() {
  return (
    <Alert className="w-full max-w-sm">
      <SparklesIcon />
      <AlertTitle>You’re on the Free plan</AlertTitle>
      <AlertDescription>Upgrade to unlock unlimited projects and history.</AlertDescription>
      <AlertAction>
        <Button size="xs">Upgrade</Button>
      </AlertAction>
    </Alert>
  );
}
