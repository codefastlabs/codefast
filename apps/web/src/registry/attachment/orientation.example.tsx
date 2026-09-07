import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@codefast/ui/attachment";
import { Image } from "@unpic/react";
import { FileTextIcon, XIcon } from "lucide-react";

export function AttachmentOrientation() {
  return (
    <div className="flex flex-wrap items-start gap-4">
      <Attachment className="w-64" orientation="horizontal">
        <AttachmentMedia>
          <FileTextIcon />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>quarterly-report.pdf</AttachmentTitle>
          <AttachmentDescription>Horizontal · PDF · 2.4 MB</AttachmentDescription>
        </AttachmentContent>
        <AttachmentActions>
          <AttachmentAction aria-label="Remove quarterly-report.pdf">
            <XIcon />
          </AttachmentAction>
        </AttachmentActions>
      </Attachment>
      <Attachment orientation="vertical">
        <AttachmentMedia variant="image">
          <Image
            alt="Workspace cover"
            className="size-full object-cover"
            layout="fullWidth"
            src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=600&auto=format&fit=crop&q=80"
          />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>workspace.png</AttachmentTitle>
          <AttachmentDescription>Vertical · PNG</AttachmentDescription>
        </AttachmentContent>
        <AttachmentActions>
          <AttachmentAction aria-label="Remove workspace.png">
            <XIcon />
          </AttachmentAction>
        </AttachmentActions>
      </Attachment>
    </div>
  );
}
