import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@codefast/ui";
import { AppWindowIcon, CodeIcon } from "lucide-react";
import type { JSX } from "react";
import { useId } from "react";

import { GridWrapper } from "@/components/grid-wrapper";

export function TabsDemo(): JSX.Element {
  const id = useId();
  return (
    <GridWrapper className="*:grid *:place-content-center">
      <div className="">
        <Tabs className="w-xs max-w-full" defaultValue="account">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
          </TabsList>
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account</CardTitle>
                <CardDescription>Make changes to your account here. Click save when you&apos;re done.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor={`${id}-name`}>Name</Label>
                  <Input defaultValue="Pedro Duarte" id={`${id}-name`} />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor={`${id}-username`}>Username</Label>
                  <Input defaultValue="@peduarte" id={`${id}-username`} />
                </div>
              </CardContent>
              <CardFooter>
                <Button>Save changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>Change your password here. After saving, you&apos;ll be logged out.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor={`${id}-current`}>Current password</Label>
                  <Input id={`${id}-current`} type="password" />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor={`${id}-new`}>New password</Label>
                  <Input id={`${id}-new`} type="password" />
                </div>
              </CardContent>
              <CardFooter>
                <Button>Save password</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <div>
        <Tabs defaultValue="home">
          <TabsList>
            <TabsTrigger value="home">Home</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div>
        <Tabs defaultValue="home">
          <TabsList>
            <TabsTrigger value="home">Home</TabsTrigger>
            <TabsTrigger disabled value="settings">
              Disabled
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div>
        <Tabs defaultValue="preview">
          <TabsList>
            <TabsTrigger value="preview">
              <AppWindowIcon />
              Preview
            </TabsTrigger>
            <TabsTrigger value="code">
              <CodeIcon />
              Code
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </GridWrapper>
  );
}
