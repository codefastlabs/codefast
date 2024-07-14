import { Button } from '@codefast/ui/button';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@codefast/ui/dialog';
import { Label } from '@codefast/ui/label';
import { type JSX } from 'react';
import { TextInput } from '@codefast/ui/text-input';

export function PresetSave(): JSX.Element {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary">Save</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[475px]">
        <DialogHeader>
          <DialogTitle>Save preset</DialogTitle>
          <DialogDescription>
            This will save the current playground state as a preset which you can access later or share with others.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <TextInput id="name" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <TextInput id="description" />
          </div>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="submit">Save</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
