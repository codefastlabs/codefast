import { Badge } from "@codefast/ui/badge";
import { Button } from "@codefast/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@codefast/ui/card";

export function CardOverview() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Team plan</CardTitle>
        <CardDescription>Up to 20 seats, unlimited projects.</CardDescription>
        <CardAction>
          <Badge variant="secondary">Popular</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold text-ui-fg">
          $49<span className="text-sm font-normal text-ui-muted">/mo</span>
        </p>
      </CardContent>
      <CardFooter className="gap-2">
        <Button className="flex-1" size="sm">
          Upgrade
        </Button>
        <Button className="flex-1" size="sm" variant="outline">
          Contact sales
        </Button>
      </CardFooter>
    </Card>
  );
}
