import {
  Button,
  cn,
  Input,
  Label,
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@codefast/ui";
import { ChevronUpIcon, CircleIcon } from "lucide-react";
import { type JSX, useId } from "react";

import { GridWrapper } from "@/components/grid-wrapper";

const SIDES = ["top", "right", "bottom", "left"] as const;

export function SheetDemo(): JSX.Element {
  const id = useId();
  return (
    <GridWrapper className="*:grid *:place-content-center">
      <div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">Open</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Edit profile</SheetTitle>
              <SheetDescription>Make changes to your profile here. Click save when you&apos;re done.</SheetDescription>
            </SheetHeader>
            <SheetBody className="grid flex-1 auto-rows-min gap-6 px-4">
              <div className="grid gap-3">
                <Label htmlFor={`${id}-sheet-demo-name`}>Name</Label>
                <Input defaultValue="Pedro Duarte" id={`${id}-sheet-demo-name`} />
              </div>
              <div className="grid gap-3">
                <Label htmlFor={`${id}-sheet-demo-username`}>Username</Label>
                <Input defaultValue="@peduarte" id={`${id}-sheet-demo-username`} />
              </div>
            </SheetBody>
            <SheetFooter>
              <Button type="submit">Save changes</Button>
              <SheetClose asChild>
                <Button variant="outline">Close</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
      <div>
        <div className="grid grid-cols-3 gap-1">
          {SIDES.map((side) => (
            <div
              key={side}
              className={cn(
                "flex items-center justify-center",
                side === "top" && "col-start-2",
                side === "right" && "col-start-3 row-start-2",
                side === "bottom" && "col-start-2 row-start-3",
                side === "left" && "row-start-2",
              )}
            >
              <Sheet>
                <SheetTrigger asChild>
                  <Button className="capitalize" size="icon" variant="outline">
                    {side === "top" && <ChevronUpIcon className="rotate-180" />}
                    {side === "right" && <ChevronUpIcon className="rotate-270" />}
                    {side === "bottom" && <ChevronUpIcon />}
                    {side === "left" && <ChevronUpIcon className="rotate-90" />}
                  </Button>
                </SheetTrigger>
                <SheetContent side={side}>
                  <SheetHeader>
                    <SheetTitle>Edit profile</SheetTitle>
                    <SheetDescription>
                      Make changes to your profile here. Click save when you&apos;re done.
                    </SheetDescription>
                  </SheetHeader>
                  <SheetBody className="overflow-y-auto border-y px-4 text-sm">
                    <h4 className="mb-4 text-lg font-medium leading-none">Lorem Ipsum</h4>
                    {Array.from({ length: 10 }).map((_, index) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: keep
                      <p key={index} className="mb-4 leading-normal">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut
                        labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
                        laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in
                        voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat
                        non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                      </p>
                    ))}
                  </SheetBody>
                  <SheetFooter>
                    <Button type="submit">Save changes</Button>
                    <SheetClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </SheetClose>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            </div>
          ))}

          <div className="col-start-2 row-start-2 flex items-center justify-center">
            <CircleIcon className="text-muted-foreground/50 size-4" />
          </div>
        </div>
      </div>
    </GridWrapper>
  );
}
