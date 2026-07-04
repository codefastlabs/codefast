import { Badge } from "@codefast/ui/badge";
import { Button } from "@codefast/ui/button";
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@codefast/ui/card";
import { Image } from "@unpic/react";

export function CardImage() {
  return (
    <Card className="relative mx-auto w-full max-w-sm pt-0">
      <div className="absolute inset-0 z-30 aspect-video bg-black/35" />
      <Image
        alt="Event cover"
        className="relative z-20 aspect-video w-full object-cover brightness-60 grayscale dark:brightness-40"
        height={360}
        layout="constrained"
        src="https://images.unsplash.com/photo-1494337480532-3725c85fd2ab?auto=format&fit=crop&w=640&q=80"
        width={640}
      />
      <CardHeader>
        <CardAction>
          <Badge variant="secondary">Featured</Badge>
        </CardAction>
        <CardTitle>Design systems meetup</CardTitle>
        <CardDescription>A practical talk on component APIs, accessibility, and shipping faster.</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button className="w-full">View Event</Button>
      </CardFooter>
    </Card>
  );
}
