import { cn } from "@codefast/tailwind-variants";
import { Avatar, AvatarFallback, AvatarImage } from "@codefast/ui/avatar";
import { Badge } from "@codefast/ui/badge";
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
import { BathIcon, BedIcon, LandPlotIcon } from "lucide-react";
import { Image } from "@unpic/react";
import { Link } from "@tanstack/react-router";

export function CardDemo() {
  return (
    <div className="flex flex-col items-start gap-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>Enter your email below to login to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="m@example.com" required />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    to="/"
                    className={cn(
                      "inline-block",
                      "ml-auto",
                      "text-sm",
                      "hover:underline",
                      "underline-offset-4",
                    )}
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Input id="password" type="password" autoComplete="current-password" required />
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button type="submit" className="w-full">
            Login
          </Button>
          <Button variant="outline" className="w-full">
            Login with Google
          </Button>
          <div className={cn("mt-4", "text-center text-sm")}>
            Don&apos;t have an account?{" "}
            <Link to="/" className={cn("underline", "underline-offset-4")}>
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Meeting Notes</CardTitle>
          <CardDescription>Transcript from the meeting with the client.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm">
          <p>Client requested dashboard redesign with focus on mobile responsiveness.</p>
          <ol className={cn("flex flex-col gap-2", "mt-4 pl-6", "list-decimal")}>
            <li>New analytics widgets for daily/weekly metrics</li>
            <li>Simplified navigation menu</li>
            <li>Dark mode support</li>
            <li>Timeline: 6 weeks</li>
            <li>Follow-up meeting scheduled for next Tuesday</li>
          </ol>
        </CardContent>
        <CardFooter>
          <div
            className={cn(
              "flex -space-x-2",
              "*:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background *:data-[slot=avatar]:grayscale",
            )}
          >
            <Avatar>
              <AvatarImage src="https://github.com/codefastlabs.png" alt="@codefast" />
              <AvatarFallback>CF</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarImage src="https://github.com/maxleiter.png" alt="@maxleiter" />
              <AvatarFallback>LR</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarImage src="https://github.com/evilrabbit.png" alt="@evilrabbit" />
              <AvatarFallback>ER</AvatarFallback>
            </Avatar>
          </div>
        </CardFooter>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Is this an image?</CardTitle>
          <CardDescription>This is a card with an image.</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Image
            src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
            alt="Photo by Drew Beamer"
            width={768}
            height={432}
            layout="constrained"
            className="aspect-video object-cover"
          />
        </CardContent>
        <CardFooter className="flex items-center gap-2">
          <Badge variant="outline">
            <BedIcon /> 4
          </Badge>
          <Badge variant="outline">
            <BathIcon /> 2
          </Badge>
          <Badge variant="outline">
            <LandPlotIcon /> 350m²
          </Badge>
          <div className={cn("ml-auto", "font-medium", "tabular-nums")}>$135,000</div>
        </CardFooter>
      </Card>
      <div
        className={cn("flex w-full flex-wrap items-start gap-8", "md:*:data-[slot=card]:basis-1/4")}
      >
        <Card>
          <CardContent className="text-sm">Content Only</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Header Only</CardTitle>
            <CardDescription>This is a card with a header and a description.</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Header and Content</CardTitle>
            <CardDescription>This is a card with a header and a content.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">Content</CardContent>
        </Card>
        <Card>
          <CardFooter className="text-sm">Footer Only</CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Header + Footer</CardTitle>
            <CardDescription>This is a card with a header and a footer.</CardDescription>
          </CardHeader>
          <CardFooter className="text-sm">Footer</CardFooter>
        </Card>
        <Card>
          <CardContent className="text-sm">Content</CardContent>
          <CardFooter className="text-sm">Footer</CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Header + Footer</CardTitle>
            <CardDescription>This is a card with a header and a footer.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">Content</CardContent>
          <CardFooter className="text-sm">Footer</CardFooter>
        </Card>
      </div>
    </div>
  );
}
