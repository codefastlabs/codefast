import { Button } from "@codefast/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@codefast/ui/card";
import { Input } from "@codefast/ui/input";
import { Label } from "@codefast/ui/label";

export function CardLogin() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Enter your credentials to continue.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-1.5">
          <Label htmlFor="card-email">Email</Label>
          <Input id="card-email" type="email" placeholder="you@example.com" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="card-password">Password</Label>
          <Input id="card-password" type="password" placeholder="••••••••" />
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" size="sm">
          Sign in
        </Button>
      </CardFooter>
    </Card>
  );
}
