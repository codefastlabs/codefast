import type { JSX } from "react";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Label,
  Switch,
} from "@codefast/ui";

interface CookieOption {
  defaultChecked?: boolean;
  description: string;
  id: string;
  title: string;
}

function CookieSettingItem({ defaultChecked, description, id, title }: CookieOption): JSX.Element {
  return (
    <div className="flex items-center justify-between space-x-4">
      <Label className="flex flex-col space-y-1" htmlFor={id}>
        <span>{title}</span>
        <span className="text-muted-foreground text-xs font-normal leading-snug">
          {description}
        </span>
      </Label>
      <Switch aria-label={title} defaultChecked={defaultChecked} id={id} />
    </div>
  );
}

export function CardsCookieSettings(): JSX.Element {
  const cookieOptions: CookieOption[] = [
    {
      defaultChecked: true,
      description: "These cookies are essential in order to use the website and use its features.",
      id: "necessary",
      title: "Strictly Necessary",
    },
    {
      description: "These cookies allow the website to provide personalized functionality.",
      id: "functional",
      title: "Functional Cookies",
    },
    {
      description: "These cookies help to improve the performance of the website.",
      id: "performance",
      title: "Performance Cookies",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cookie Settings</CardTitle>
        <CardDescription>Manage your cookie settings here.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        {cookieOptions.map((option) => (
          <CookieSettingItem key={option.id} {...option} />
        ))}
      </CardContent>
      <CardFooter>
        <Button className="w-full" variant="outline">
          Save preferences
        </Button>
      </CardFooter>
    </Card>
  );
}
