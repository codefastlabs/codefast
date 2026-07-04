import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from "@codefast/ui/attachment";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@codefast/ui/dialog";
import { CopyIcon, FileSearchIcon, XIcon } from "lucide-react";

export function AttachmentTriggerExample() {
  return (
    <Dialog>
      <Attachment className="w-full max-w-xs">
        <AttachmentMedia>
          <FileSearchIcon />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>research-summary.pdf</AttachmentTitle>
          <AttachmentDescription>Open preview dialog</AttachmentDescription>
        </AttachmentContent>
        <AttachmentActions>
          <AttachmentAction aria-label="Copy link">
            <CopyIcon />
          </AttachmentAction>
          <AttachmentAction aria-label="Remove research-summary.pdf">
            <XIcon />
          </AttachmentAction>
        </AttachmentActions>
        <DialogTrigger asChild>
          <AttachmentTrigger aria-label="Preview research-summary.pdf" />
        </DialogTrigger>
      </Attachment>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>research-summary.pdf</DialogTitle>
          <DialogDescription>
            The trigger fills the card and opens the dialog, while the actions above it stay independently clickable.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
