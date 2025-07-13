import Link from "next/link";
import { useId } from "react";
import type { ComponentProps, JSX } from "react";

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, cn, Input, Label } from "@codefast/ui";

export function LoginForm({ className, ...props }: ComponentProps<"div">): JSX.Element {
  const id = useId();
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>Enter your email below to login to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor={`${id}-email`}>Email</Label>
                <Input required id={`${id}-email`} placeholder="m@example.com" type="email" />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor={`${id}-password`}>Password</Label>
                  <Link className="ml-auto inline-block text-sm underline-offset-4 hover:underline" href="/">
                    Forgot your password?
                  </Link>
                </div>
                <Input required id={`${id}-password`} type="password" />
              </div>
              <div className="flex flex-col gap-3">
                <Button className="w-full" type="submit">
                  Login
                </Button>
                <Button className="w-full" variant="outline">
                  Login with Google
                </Button>
              </div>
            </div>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link className="underline underline-offset-4" href="/">
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
