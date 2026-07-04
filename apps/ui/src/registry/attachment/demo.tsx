import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@codefast/ui/attachment";
import { FileTextIcon, XIcon } from "lucide-react";

export function AttachmentDemo() {
  return (
    <Attachment className="w-full max-w-xs">
      <AttachmentMedia>
        <FileTextIcon />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>quarterly-report.pdf</AttachmentTitle>
        <AttachmentDescription>1.2 MB</AttachmentDescription>
      </AttachmentContent>
      <AttachmentActions>
        <AttachmentAction aria-label="Remove attachment">
          <XIcon />
        </AttachmentAction>
      </AttachmentActions>
    </Attachment>
  );
}
