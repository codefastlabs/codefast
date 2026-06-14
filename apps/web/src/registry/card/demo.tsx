import { Button } from "@codefast/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@codefast/ui/card";

export function CardDemo() {
  return (
    <Card className="w-full max-w-xs">
      <CardHeader>
        <CardTitle>Team plan</CardTitle>
        <CardDescription>Up to 20 seats, unlimited projects.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-ui-fg">
          $49<span className="text-sm font-normal text-ui-muted">/mo</span>
        </p>
        <Button className="mt-4 w-full" size="sm">
          Upgrade now
        </Button>
      </CardContent>
    </Card>
  );
}
