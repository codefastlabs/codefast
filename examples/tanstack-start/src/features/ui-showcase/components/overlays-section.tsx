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
import { Button } from "@codefast/ui/button";
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
import { Label } from "@codefast/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@codefast/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@codefast/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@codefast/ui/tooltip";

import { DemoSection } from "#/components/demo-section";

export function OverlaysSection() {
  return (
    <DemoSection description="Radix-backed overlays — each opens a portal and traps focus while open." title="Overlays">
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
  );
}
