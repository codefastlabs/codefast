import type { Metadata } from "next";
import type { ComponentProps, JSX } from "react";

import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  cn,
  Input,
  Label,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@codefast/ui";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your account settings",
};

const timezones = [
  {
    label: "Americas",
    timezones: [
      { value: "America/New_York", label: "(GMT-5) New York" },
      { value: "America/Los_Angeles", label: "(GMT-8) Los Angeles" },
      { value: "America/Chicago", label: "(GMT-6) Chicago" },
      { value: "America/Toronto", label: "(GMT-5) Toronto" },
      { value: "America/Vancouver", label: "(GMT-8) Vancouver" },
      { value: "America/Sao_Paulo", label: "(GMT-3) São Paulo" },
    ],
  },
  {
    label: "Europe",
    timezones: [
      { value: "Europe/London", label: "(GMT+0) London" },
      { value: "Europe/Paris", label: "(GMT+1) Paris" },
      { value: "Europe/Berlin", label: "(GMT+1) Berlin" },
      { value: "Europe/Rome", label: "(GMT+1) Rome" },
      { value: "Europe/Madrid", label: "(GMT+1) Madrid" },
      { value: "Europe/Amsterdam", label: "(GMT+1) Amsterdam" },
    ],
  },
  {
    label: "Asia/Pacific",
    timezones: [
      { value: "Asia/Tokyo", label: "(GMT+9) Tokyo" },
      { value: "Asia/Shanghai", label: "(GMT+8) Shanghai" },
      { value: "Asia/Singapore", label: "(GMT+8) Singapore" },
      { value: "Asia/Dubai", label: "(GMT+4) Dubai" },
      { value: "Australia/Sydney", label: "(GMT+11) Sydney" },
      { value: "Asia/Seoul", label: "(GMT+9) Seoul" },
    ],
  },
] as const;

const loginHistory = [
  {
    date: "2024-01-01",
    ip: "192.168.1.1",
    location: "New York, USA",
  },
  {
    date: "2023-12-29",
    ip: "172.16.0.100",
    location: "London, UK",
  },
  {
    date: "2023-12-28",
    ip: "10.0.0.50",
    location: "Toronto, Canada",
  },
  {
    date: "2023-12-25",
    ip: "192.168.2.15",
    location: "Sydney, Australia",
  },
] as const;

const activeSessions = [
  {
    device: "MacBook Pro",
    browser: "Chrome",
    os: "macOS",
  },
  {
    device: "iPhone",
    browser: "Safari",
    os: "iOS",
  },
  {
    device: "iPad",
    browser: "Safari",
    os: "iOS",
  },
  {
    device: "Android Phone",
    browser: "Chrome",
    os: "Android",
  },
] as const;

export default function SettingsPage(): JSX.Element {
  return (
    <div className="@container/page flex flex-1 flex-col gap-8 p-6">
      <Tabs className="gap-6" defaultValue="account">
        <div className="flex items-center justify-between" data-slot="dashboard-header">
          <TabsList>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent className="grid gap-6" value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Make changes to your account here.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="@container" id="form-account">
                <FieldGroup>
                  <Field>
                    <Label htmlFor="name">Name</Label>
                    <FieldControl>
                      <Input required id="name" placeholder="First and last name" />
                    </FieldControl>
                    <FieldDescription>This is your public display name.</FieldDescription>
                  </Field>
                  <Field>
                    <Label htmlFor="email">Email</Label>
                    <FieldControl>
                      <Input required id="email" placeholder="you@example.com" />
                    </FieldControl>
                  </Field>
                  <Field>
                    <Label htmlFor="timezone">Timezone</Label>
                    <FieldControl>
                      <Select>
                        <SelectTrigger id="timezone">
                          <SelectValue placeholder="Select a timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          {timezones.map((timezone) => (
                            <SelectGroup key={timezone.label}>
                              <SelectLabel>{timezone.label}</SelectLabel>
                              {timezone.timezones.map((time) => (
                                <SelectItem key={time.value} value={time.value}>
                                  {time.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          ))}
                        </SelectContent>
                      </Select>
                    </FieldControl>
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>
            <CardFooter className="border-t">
              <Button form="form-account" type="submit" variant="secondary">
                Save changes
              </Button>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Manage how you receive notifications.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="@container" id="form-notifications">
                <FieldGroup>
                  <Field>
                    <Label htmlFor="channels">Notification Channels</Label>
                    <FieldControl className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Checkbox id="notification-email" />
                        <Label htmlFor="notification-email">Email</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox id="notification-sms" />
                        <Label htmlFor="notification-sms">SMS</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox id="notification-push" />
                        <Label htmlFor="notification-push">Push</Label>
                      </div>
                    </FieldControl>
                    <FieldDescription>Choose how you want to receive notifications.</FieldDescription>
                  </Field>
                  <Field>
                    <Label htmlFor="types">Notification Types</Label>
                    <FieldControl className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Checkbox id="notification-account" />
                        <Label htmlFor="notification-account">Account Activity</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox defaultChecked disabled id="notification-security" />
                        <Label htmlFor="notification-security">Security Alerts</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox id="notification-marketing" />
                        <Label htmlFor="notification-marketing">Marketing & Promotions</Label>
                      </div>
                    </FieldControl>
                    <FieldDescription>Choose how you want to receive notifications.</FieldDescription>
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>
            <CardFooter className="border-t">
              <Button form="form-notifications" type="submit" variant="secondary">
                Save changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent className="@3xl/page:grid-cols-2 grid gap-6" value="security">
          <Card className="@3xl/page:col-span-2">
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Make changes to your security settings here.</CardDescription>
            </CardHeader>
            <CardContent className="@container">
              <form id="form-security">
                <FieldGroup>
                  <Field>
                    <Label htmlFor="current-password">Current Password</Label>
                    <FieldControl>
                      <Input required id="current-password" placeholder="Current password" />
                    </FieldControl>
                    <FieldDescription>This is your current password.</FieldDescription>
                  </Field>
                  <Field>
                    <Label htmlFor="new-password">New Password</Label>
                    <FieldControl>
                      <Input required id="new-password" placeholder="New password" />
                    </FieldControl>
                  </Field>
                  <Field>
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <FieldControl>
                      <Input id="confirm-password" placeholder="Confirm password" />
                    </FieldControl>
                  </Field>
                  <Field>
                    <FieldControl>
                      <Switch className="self-start" id="enable-two-factor-auth" />
                    </FieldControl>
                    <Label htmlFor="enable-two-factor-auth">Enable two-factor authentication</Label>
                    <FieldDescription>
                      This will add an extra layer of security to your account. Make this an extra long description to
                      test the layout.
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>
            <CardFooter className="border-t">
              <Button form="form-security" type="submit" variant="secondary">
                Save changes
              </Button>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Login History</CardTitle>
              <CardDescription>Recent login activities on your account.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="@md/page:table-cell hidden">IP</TableHead>
                    <TableHead>Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loginHistory.map((login) => (
                    <TableRow key={login.date}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {new Date(login.date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                          <span className="@md/page:hidden flex">{login.ip}</span>
                        </div>
                      </TableCell>
                      <TableCell className="@md/page:table-cell hidden">{login.ip}</TableCell>
                      <TableCell>{login.location}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>Current active sessions on your account.</CardDescription>
              <CardAction>
                <Button size="sm" variant="outline">
                  <span className="@md/card-header:block hidden">Manage Sessions</span>
                  <span className="@md/card-header:hidden block">Manage</span>
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device</TableHead>
                    <TableHead>Browser</TableHead>
                    <TableHead>OS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeSessions.map((session) => (
                    <TableRow key={session.device}>
                      <TableCell>{session.device}</TableCell>
                      <TableCell>{session.browser}</TableCell>
                      <TableCell>{session.os}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FieldGroup({ children }: ComponentProps<"div">): JSX.Element {
  return (
    <div className="@container/field-group @3xl:gap-6 flex min-w-0 max-w-4xl flex-col gap-8" data-slot="field-group">
      {children}
    </div>
  );
}

function Field({ children, className, ...props }: ComponentProps<"div">): JSX.Element {
  return (
    <div
      className={cn(
        "@3xl/field-group:grid-cols-2 @3xl/field-group:gap-6 grid auto-rows-min items-start gap-3 *:data-[slot=label]:col-start-1 *:data-[slot=label]:row-start-1",
        className,
      )}
      data-slot="field"
      {...props}
    >
      {children}
    </div>
  );
}

function FieldControl({ children, className, ...props }: ComponentProps<"div">): JSX.Element {
  return (
    <div
      className={cn(
        "@3xl/field-group:col-start-2 @3xl/field-group:row-span-2 @3xl/field-group:row-start-1 @3xl/field-group:self-start",
        className,
      )}
      data-slot="field-control"
      {...props}
    >
      {children}
    </div>
  );
}

function FieldDescription({ children, className, ...props }: ComponentProps<"p">): JSX.Element {
  return (
    <p
      className={cn(
        "text-muted-foreground @3xl/field-group:col-start-1 @3xl/field-group:row-start-1 @3xl/field-group:translate-y-6 text-sm",
        className,
      )}
      data-slot="field-description"
      {...props}
    >
      {children}
    </p>
  );
}
