import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@codefast/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@codefast/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@codefast/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@codefast/ui/avatar";
import { Badge } from "@codefast/ui/badge";
import { Button } from "@codefast/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@codefast/ui/card";
import { Checkbox } from "@codefast/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@codefast/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@codefast/ui/dropdown-menu";
import { Input } from "@codefast/ui/input";
import { Kbd, KbdGroup } from "@codefast/ui/kbd";
import { Label } from "@codefast/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@codefast/ui/popover";
import { Progress } from "@codefast/ui/progress";
import { RadioGroup, RadioGroupItem } from "@codefast/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@codefast/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@codefast/ui/sheet";
import { Skeleton } from "@codefast/ui/skeleton";
import { Slider } from "@codefast/ui/slider";
import { toast } from "@codefast/ui/sonner";
import { Switch } from "@codefast/ui/switch";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@codefast/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@codefast/ui/tabs";
import { Textarea } from "@codefast/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@codefast/ui/tooltip";
import { createFileRoute } from "@tanstack/react-router";

import { DemoSection } from "#/components/demo-section";

export const Route = createFileRoute("/ui")({
  component: UiPage,
});

function UiPage() {
  return (
    <div className="space-y-12">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">@codefast/ui</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Components imported from the published package via per-component subpaths such as{" "}
          <code className="font-mono">@codefast/ui/button</code>. Use the appearance toggle in the header — every
          surface here is driven by <code className="font-mono">@codefast/theme</code>.
        </p>
      </header>

      <DemoSection
        description="The full variant set, rendered straight from the shipped buttonVariants."
        title="Button variants"
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button>Default</Button>
          <Button size="lg">Large</Button>
          <Button disabled>Disabled</Button>
        </div>
      </DemoSection>

      <DemoSection title="Badges">
        <div className="flex flex-wrap items-center gap-3">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </div>
      </DemoSection>

      <DemoSection description="Card primitives plus a form field, a switch, and tabs." title="Composition">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Newsletter</CardTitle>
              <CardDescription>Card, Input, Label and Switch working together.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" placeholder="you@example.com" type="email" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="weekly">Weekly digest</Label>
                <Switch defaultChecked id="weekly" />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Subscribe</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tabs</CardTitle>
              <CardDescription>Radix-backed, keyboard accessible.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="install">Install</TabsTrigger>
                </TabsList>
                <TabsContent className="pt-3 text-sm text-muted-foreground" value="overview">
                  Each tab panel is an accessible region with managed focus and roving tabindex.
                </TabsContent>
                <TabsContent className="pt-3 text-sm" value="install">
                  <code className="font-mono">pnpm add @codefast/ui</code>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </DemoSection>

      <DemoSection
        description="Radix-backed overlays — each opens a portal and traps focus while open."
        title="Overlays"
      >
        <div className="flex flex-wrap items-center gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit profile</DialogTitle>
                <DialogDescription>
                  Make changes to your profile here. Click save when you&apos;re done.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="dialog-name">Name</Label>
                <Input defaultValue="Ada Lovelace" id="dialog-name" />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button>Save changes</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">Alert dialog</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the resource.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Dropdown menu</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>My account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Billing</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline">Tooltip</Button>
              </TooltipTrigger>
              <TooltipContent>Hovered content lives in a portal.</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Popover</Button>
            </PopoverTrigger>
            <PopoverContent className="w-72">
              <PopoverHeader>
                <PopoverTitle>Dimensions</PopoverTitle>
                <PopoverDescription>Set the layout dimensions for the container.</PopoverDescription>
              </PopoverHeader>
            </PopoverContent>
          </Popover>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">Sheet</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Edit settings</SheetTitle>
                <SheetDescription>A side panel that slides in from the edge of the screen.</SheetDescription>
              </SheetHeader>
              <SheetFooter>
                <Button>Save</Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </DemoSection>

      <DemoSection description="Uncontrolled form controls with sensible defaults." title="Form controls">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="framework">Framework</Label>
            <Select>
              <SelectTrigger className="w-full" id="framework">
                <SelectValue placeholder="Pick a framework" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tanstack-start">TanStack Start</SelectItem>
                <SelectItem value="next">Next.js</SelectItem>
                <SelectItem value="remix">Remix</SelectItem>
                <SelectItem value="astro">Astro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Notifications</Label>
            <div className="flex items-center gap-2">
              <Checkbox defaultChecked id="marketing" />
              <Label htmlFor="marketing">Marketing emails</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="security" />
              <Label htmlFor="security">Security alerts</Label>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Plan</Label>
            <RadioGroup defaultValue="pro">
              <div className="flex items-center gap-2">
                <RadioGroupItem id="plan-free" value="free" />
                <Label htmlFor="plan-free">Free</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem id="plan-pro" value="pro" />
                <Label htmlFor="plan-pro">Pro</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem id="plan-team" value="team" />
                <Label htmlFor="plan-team">Team</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label htmlFor="volume">Volume</Label>
            <Slider defaultValue={[60]} id="volume" max={100} min={0} step={1} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" placeholder="Type your message here." />
          </div>
        </div>
      </DemoSection>

      <DemoSection description="Status, media, and data-display primitives." title="Feedback & display">
        <div className="space-y-3">
          <Alert>
            <AlertTitle>Heads up!</AlertTitle>
            <AlertDescription>You can add components to your app using the CLI.</AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>Your session has expired. Please log in again.</AlertDescription>
          </Alert>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Avatar>
            <AvatarImage alt="@codefast" src="https://github.com/codefastlabs.png" />
            <AvatarFallback>CF</AvatarFallback>
          </Avatar>
          <Avatar size="lg">
            <AvatarFallback>AL</AvatarFallback>
          </Avatar>
          <KbdGroup>
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        </div>

        <Accordion collapsible defaultValue="item-1" type="single">
          <AccordionItem value="item-1">
            <AccordionTrigger>Is it accessible?</AccordionTrigger>
            <AccordionContent>Yes. It adheres to the WAI-ARIA design pattern.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Is it styled?</AccordionTrigger>
            <AccordionContent>Yes, it ships with default styles from @codefast/ui.</AccordionContent>
          </AccordionItem>
        </Accordion>

        <Table>
          <TableCaption>A list of recent invoices.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">INV001</TableCell>
              <TableCell>
                <Badge variant="secondary">Paid</Badge>
              </TableCell>
              <TableCell className="text-right">$250.00</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">INV002</TableCell>
              <TableCell>
                <Badge variant="outline">Pending</Badge>
              </TableCell>
              <TableCell className="text-right">$150.00</TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <div className="space-y-2">
          <Label>Upload progress</Label>
          <Progress value={60} />
        </div>

        <div className="flex items-center gap-4">
          <Skeleton className="size-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </DemoSection>

      <DemoSection
        description="A single Toaster is mounted in the root document; this button pushes a toast onto it."
        title="Toast"
      >
        <Button
          variant="outline"
          onClick={() => {
            toast("Event created", {
              description: "Sunday, December 03 at 9:00 AM",
              action: { label: "Undo", onClick: () => undefined },
            });
          }}
        >
          Show toast
        </Button>
      </DemoSection>
    </div>
  );
}
