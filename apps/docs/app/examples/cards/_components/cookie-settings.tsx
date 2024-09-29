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
} from '@codefast/ui';
import { type JSX } from 'react';

export function CookieSettings(): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cookie Settings</CardTitle>
        <CardDescription>Manage your cookie settings here.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="flex items-center justify-between space-x-2">
          <Label className="flex flex-col space-y-1" htmlFor="necessary">
            <span>Strictly Necessary</span>
            <span className="text-muted-foreground font-normal leading-snug">
              These cookies are essential in order to use the website and use its features.
            </span>
          </Label>
          <Switch defaultChecked id="necessary" />
        </div>
        <div className="flex items-center justify-between space-x-2">
          <Label className="flex flex-col space-y-1" htmlFor="functional">
            <span>Functional Cookies</span>
            <span className="text-muted-foreground font-normal leading-snug">
              These cookies allow the website to provide personalized functionality.
            </span>
          </Label>
          <Switch id="functional" />
        </div>
        <div className="flex items-center justify-between space-x-2">
          <Label className="flex flex-col space-y-1" htmlFor="performance">
            <span>Performance Cookies</span>
            <span className="text-muted-foreground font-normal leading-snug">
              These cookies help to improve the performance of the website.
            </span>
          </Label>
          <Switch id="performance" />
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" variant="outline">
          Save preferences
        </Button>
      </CardFooter>
    </Card>
  );
}
