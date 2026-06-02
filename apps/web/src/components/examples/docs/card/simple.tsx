import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@codefast/ui/card";

export function CardSimple() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>You have 3 unread messages.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-ui-muted">
        Compose Card from Header, Content, and Footer slots — each is optional.
      </CardContent>
    </Card>
  );
}
