import type { JSX } from 'react';

import {
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
} from '@codefast/ui';

export function PresetSave(): JSX.Element {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary">Save</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[29.6875rem]">
        <DialogHeader>
          <DialogTitle>Save preset</DialogTitle>
          <DialogDescription>
            This will save the current playground state as a preset which you can access later or
            share with others.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" />
          </div>
        </DialogBody>
        <DialogFooter>
          <DialogClose type="submit" variant="default">
            Save
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
