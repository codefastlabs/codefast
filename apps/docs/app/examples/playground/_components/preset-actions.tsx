'use client';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Label,
  Switch,
  toast,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@codefast/ui';
import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import { type JSX, useState } from 'react';

export function PresetActions(): JSX.Element {
  const [open, setOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
      <Tooltip>
        <DropdownMenu>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button aria-label="Actions" prefix={<DotsHorizontalIcon />} variant="secondary" />
            </DropdownMenuTrigger>
          </TooltipTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={() => {
                setOpen(true);
              }}
            >
              Content filter preferences
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                setShowDeleteDialog(true);
              }}
            >
              Delete preset
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <TooltipContent>Actions</TooltipContent>
      </Tooltip>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Content filter preferences</DialogTitle>
            <DialogDescription>
              The content filter flags text that may violate our content policy. It&apos;s powered by our moderation
              endpoint which is free to use to moderate your OpenAI API traffic. Learn more.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <h4 className="text-muted-foreground text-sm">Playground Warnings</h4>
            <div className="flex items-start justify-between space-x-4 pt-3">
              <Switch defaultChecked id="show" name="show" />
              <Label className="grid gap-1 font-normal" htmlFor="show">
                <span className="font-semibold">Show a warning when content is flagged</span>
                <span className="text-muted-foreground text-sm">
                  A warning will be shown when sexual, hateful, violent or self-harm content is detected.
                </span>
              </Label>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setOpen(false);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This preset will no longer be accessible by you or others you&apos;ve shared
              it with.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => {
                setShowDeleteDialog(false);
                toast.message('This preset has been deleted.');
              }}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
