import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@codefast/ui";
import { BathIcon, BedIcon, LandPlotIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useId } from "react";

import { GridWrapper } from "@/components/grid-wrapper";

import type { JSX } from "react";

export function CardDemo(): JSX.Element {
  const id = useId();
  return (
    <GridWrapper>
      <div className="">
        <form>
          <Card>
            <CardHeader>
              <CardTitle>Login to your account</CardTitle>
              <CardDescription>Enter your email below to login to your account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor={`${id}-email`}>Email</Label>
                  <Input id={`${id}-email`} placeholder="m@example.com" required type="email" />
                </div>
                <div className="grid gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Label htmlFor={`${id}-password`}>Password</Label>
                    <Link className="inline-block text-sm underline-offset-4 hover:underline" href="/">
                      Forgot your password?
                    </Link>
                  </div>
                  <Input id={`${id}-password`} required type="password" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-2">
              <Button className="w-full" type="submit">
                Login
              </Button>
              <Button className="w-full" variant="outline">
                Login with Google
              </Button>
              <div className="mt-4 text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link className="underline underline-offset-4" href="/">
                  Sign up
                </Link>
              </div>
            </CardFooter>
          </Card>
        </form>
      </div>
      <div className="">
        <Card>
          <CardHeader>
            <CardTitle>Meeting Notes</CardTitle>
            <CardDescription>Transcript from the meeting with the client.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <p>Client requested dashboard redesign with focus on mobile responsiveness.</p>
            <ol className="mt-4 flex list-decimal flex-col gap-2 pl-6">
              <li>New analytics widgets for daily/weekly metrics</li>
              <li>Simplified navigation menu</li>
              <li>Dark mode support</li>
              <li>Timeline: 6 weeks</li>
              <li>Follow-up meeting scheduled for next Tuesday</li>
            </ol>
          </CardContent>
          <CardFooter>
            <div className="*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:grayscale">
              <Avatar>
                <AvatarImage alt="@codefast/ui" src="/avatars/codefast-ui.webp" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarImage alt="@leerob" src="/avatars/leerob.png" />
                <AvatarFallback>LR</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarImage alt="@evilrabbit" src="/avatars/evilrabbit.png" />
                <AvatarFallback>ER</AvatarFallback>
              </Avatar>
            </div>
          </CardFooter>
        </Card>
      </div>
      <div className="">
        <Card>
          <CardHeader>
            <CardTitle>Is this an image?</CardTitle>
            <CardDescription>This is a card with an image.</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Image
              alt="Photo by Drew Beamer"
              className="aspect-video w-full object-cover"
              height={500}
              src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
              width={500}
            />
          </CardContent>
          <CardFooter className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                <BedIcon /> 4
              </Badge>
              <Badge variant="outline">
                <BathIcon /> 2
              </Badge>
              <Badge variant="outline">
                <LandPlotIcon /> 350m²
              </Badge>
            </div>
            <div className="font-medium tabular-nums">$135,000</div>
          </CardFooter>
        </Card>
      </div>
      <div className="">
        <Card>
          <CardContent className="text-sm">Content Only</CardContent>
        </Card>
      </div>
      <div className="">
        <Card>
          <CardHeader>
            <CardTitle>Header Only</CardTitle>
            <CardDescription>This is a card with a header and a description.</CardDescription>
          </CardHeader>
        </Card>
      </div>
      <div className="">
        <Card>
          <CardHeader>
            <CardTitle>Header and Content</CardTitle>
            <CardDescription>This is a card with a header and a content.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">Content</CardContent>
        </Card>
      </div>
      <div className="">
        <Card>
          <CardFooter className="text-sm">Footer Only</CardFooter>
        </Card>
      </div>
      <div className="">
        <Card>
          <CardHeader>
            <CardTitle>Header + Footer</CardTitle>
            <CardDescription>This is a card with a header and a footer.</CardDescription>
          </CardHeader>
          <CardFooter className="text-sm">Footer</CardFooter>
        </Card>
      </div>
      <div className="">
        <Card>
          <CardContent className="text-sm">Content</CardContent>
          <CardFooter className="text-sm">Footer</CardFooter>
        </Card>
      </div>
      <div className="">
        <Card>
          <CardHeader>
            <CardTitle>Header + Footer</CardTitle>
            <CardDescription>This is a card with a header and a footer.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">Content</CardContent>
          <CardFooter className="text-sm">Footer</CardFooter>
        </Card>
      </div>
    </GridWrapper>
  );
}
